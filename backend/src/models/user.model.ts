import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { User } from '../types';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    return rows[0] || null;
  }

  const store = getLocalStore();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  return user || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  const store = getLocalStore();
  const user = store.users.find((u) => u.id === id);
  return user || null;
};

export const createUser = async (
  name: string,
  email: string,
  passwordHash: string
): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash]
    );
    return {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
  }

  let createdUser: User | null = null;
  updateLocalStore((store) => {
    const id = store.nextIds.users++;
    createdUser = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    store.users.push(createdUser);
  });

  return createdUser!;
};

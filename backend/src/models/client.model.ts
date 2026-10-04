import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { Client } from '../types';
import { generateShareToken } from '../utils/crypto';

export const findClientsByUserId = async (userId: number): Promise<Client[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      `SELECT c.*, COUNT(p.id) AS project_count 
       FROM clients c 
       LEFT JOIN projects p ON p.client_id = c.id 
       WHERE c.user_id = ? 
       GROUP BY c.id 
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  const store = getLocalStore();
  const clients = store.clients.filter((c) => c.user_id === userId);
  return clients.map((c) => ({
    ...c,
    project_count: store.projects.filter((p) => p.client_id === c.id).length,
  }));
};

export const findClientById = async (id: number): Promise<Client | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      `SELECT c.*, COUNT(p.id) AS project_count 
       FROM clients c 
       LEFT JOIN projects p ON p.client_id = c.id 
       WHERE c.id = ? 
       GROUP BY c.id`,
      [id]
    );
    return rows[0] || null;
  }

  const store = getLocalStore();
  const client = store.clients.find((c) => c.id === id);
  if (!client) return null;
  return {
    ...client,
    project_count: store.projects.filter((p) => p.client_id === client.id).length,
  };
};

export const findClientByShareToken = async (shareToken: string): Promise<Client | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      'SELECT * FROM clients WHERE share_token = ? LIMIT 1',
      [shareToken]
    );
    return rows[0] || null;
  }

  const store = getLocalStore();
  const client = store.clients.find((c) => c.share_token === shareToken);
  return client || null;
};

export const createClient = async (
  userId: number,
  name: string,
  email?: string | null,
  company?: string | null
): Promise<Client> => {
  const shareToken = generateShareToken();

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      'INSERT INTO clients (user_id, name, email, company, share_token) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email?.trim() || null, company?.trim() || null, shareToken]
    );
    return {
      id: result.insertId,
      user_id: userId,
      name: name.trim(),
      email: email?.trim() || null,
      company: company?.trim() || null,
      share_token: shareToken,
      created_at: new Date().toISOString(),
      project_count: 0,
    };
  }

  let createdClient: Client | null = null;
  updateLocalStore((store) => {
    const id = store.nextIds.clients++;
    createdClient = {
      id,
      user_id: userId,
      name: name.trim(),
      email: email?.trim() || null,
      company: company?.trim() || null,
      share_token: shareToken,
      created_at: new Date().toISOString(),
      project_count: 0,
    };
    store.clients.unshift(createdClient);
  });

  return createdClient!;
};

export const updateClient = async (
  id: number,
  data: { name?: string; email?: string | null; company?: string | null }
): Promise<Client | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name.trim());
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email?.trim() || null);
    }
    if (data.company !== undefined) {
      updates.push('company = ?');
      values.push(data.company?.trim() || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    return findClientById(id);
  }

  let updatedClient: Client | null = null;
  updateLocalStore((store) => {
    const client = store.clients.find((c) => c.id === id);
    if (client) {
      if (data.name !== undefined) client.name = data.name.trim();
      if (data.email !== undefined) client.email = data.email?.trim() || null;
      if (data.company !== undefined) client.company = data.company?.trim() || null;
      updatedClient = { ...client };
    }
  });

  return updatedClient;
};

export const deleteClient = async (id: number): Promise<boolean> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  let deleted = false;
  updateLocalStore((store) => {
    const initialLen = store.clients.length;
    store.clients = store.clients.filter((c) => c.id !== id);
    if (store.clients.length < initialLen) {
      deleted = true;
      // cascade delete projects, tasks, assets
      const projectIdsToDelete = store.projects.filter((p) => p.client_id === id).map((p) => p.id);
      store.projects = store.projects.filter((p) => p.client_id !== id);
      store.tasks = store.tasks.filter((t) => !projectIdsToDelete.includes(t.project_id));
      store.assets = store.assets.filter((a) => !projectIdsToDelete.includes(a.project_id));
    }
  });

  return deleted;
};

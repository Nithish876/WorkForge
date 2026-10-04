import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { hashPassword, generateShareToken } from '../utils/crypto';

let pool: Pool | null = null;
let isUsingFallback = false;

// Fallback JSON in-memory store in case MySQL credentials are not yet configured
interface LocalDbStore {
  users: any[];
  clients: any[];
  projects: any[];
  tasks: any[];
  assets: any[];
  nextIds: {
    users: number;
    clients: number;
    projects: number;
    tasks: number;
    assets: number;
  };
}

const LOCAL_DB_PATH = path.resolve(__dirname, '../../dev-database.json');

const loadLocalDb = (): LocalDbStore => {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
    } catch {
      // ignore
    }
  }
  return {
    users: [],
    clients: [],
    projects: [],
    tasks: [],
    assets: [],
    nextIds: { users: 1, clients: 1, projects: 1, tasks: 1, assets: 1 },
  };
};

const saveLocalDb = (data: LocalDbStore): void => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

let localStore: LocalDbStore = loadLocalDb();

export const isMySQLActive = (): boolean => !isUsingFallback;

export const initDatabase = async (): Promise<void> => {
  try {
    console.log(`[DB] Attempting to connect to MySQL at ${env.db.host}:${env.db.port}...`);
    // Connect to MySQL server to ensure DB exists
    const rootConn = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      connectTimeout: 2000,
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\`;`);
    await rootConn.end();

    // Create pool for application database
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });

    console.log(`[DB] Connected to MySQL database "${env.db.name}". Initializing tables...`);

    // Schema Blueprint as specified in plan.md
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150),
        company VARCHAR(100),
        share_token VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        github_repo VARCHAR(255),
        status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        sort_order INT DEFAULT 0,
        is_client_visible BOOLEAN DEFAULT TRUE,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_by ENUM('freelancer', 'client') DEFAULT 'freelancer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    console.log('[DB] MySQL schema verified successfully.');
    await seedInitialDataMySQL();
  } catch (error: any) {
    console.warn(`[DB] MySQL connection failed (${error.message}).`);
    console.warn('[DB] Switching to persistent local storage adapter for seamless offline/dev operation.');
    console.warn('[DB] Note: Update backend/.env DB_PASSWORD to switch directly to MySQL80.');
    isUsingFallback = true;
    await seedInitialDataFallback();
  }
};

export const getPool = (): Pool | null => pool;

// Seed initial demo data for immediate testing
const seedInitialDataMySQL = async (): Promise<void> => {
  if (!pool) return;
  const [users]: any = await pool.query('SELECT COUNT(*) as count FROM users');
  if (users[0]?.count === 0) {
    console.log('[DB] Seeding initial freelancer and demo client data in MySQL...');
    const hashed = await hashPassword('password123');
    const [userResult]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Alex Rivers', 'alex@freelancer.io', hashed]
    );
    const userId = userResult.insertId;

    const tokenAcme = generateShareToken();
    const tokenNordic = generateShareToken();

    const [client1Result]: any = await pool.query(
      'INSERT INTO clients (user_id, name, email, company, share_token) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Sarah Jenkins', 'sarah@acmecorp.com', 'Acme Corporation', tokenAcme]
    );
    const client1Id = client1Result.insertId;

    const [client2Result]: any = await pool.query(
      'INSERT INTO clients (user_id, name, email, company, share_token) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Lukas Lindqvist', 'lukas@nordicdesign.co', 'Nordic Design Studio', tokenNordic]
    );
    const client2Id = client2Result.insertId;

    const [proj1Result]: any = await pool.query(
      'INSERT INTO projects (client_id, title, description, github_repo, status, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [client1Id, 'Enterprise Billing Portal', 'Modern self-service subscription and invoicing web application with Stripe checkout and automated PDF invoices.', 'facebook/react', 'active', '2026-11-15']
    );
    const proj1Id = proj1Result.insertId;

    const [proj2Result]: any = await pool.query(
      'INSERT INTO projects (client_id, title, description, github_repo, status, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [client2Id, 'E-Commerce Mobile Redesign', 'Mobile-first storefront with fast search, responsive product grids, and checkout flow.', 'tailwindlabs/tailwindcss', 'active', '2026-12-01']
    );
    const proj2Id = proj2Result.insertId;

    // Seed tasks for project 1
    const tasksP1 = [
      ['Design user authentication flow & session tokens', 'Ensure secure JWT issuance with refresh mechanism', 'done', 'high', 0, true, '2026-10-10'],
      ['Integrate Stripe Webhook listeners', 'Handle invoice.payment_succeeded and customer.subscription.updated', 'in_progress', 'high', 1, true, '2026-10-18'],
      ['Build client invoice PDF generator', 'Use server-side templating to produce branded invoices', 'review', 'medium', 2, true, '2026-10-25'],
      ['Configure Redis caching layer', 'Internal query performance tuning for transactions', 'todo', 'low', 3, false, '2026-11-01'],
      ['Implement multi-currency checkout modal', 'Support USD, EUR, GBP automatic conversion', 'todo', 'medium', 4, true, '2026-11-08'],
    ];

    for (const t of tasksP1) {
      await pool.query(
        'INSERT INTO tasks (project_id, title, description, status, priority, sort_order, is_client_visible, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [proj1Id, ...t]
      );
    }

    console.log('[DB] Seeding completed.');
  }
};

const seedInitialDataFallback = async (): Promise<void> => {
  if (localStore.users.length === 0) {
    const hashed = await hashPassword('password123');
    const user = {
      id: 1,
      name: 'Alex Rivers',
      email: 'alex@freelancer.io',
      password_hash: hashed,
      created_at: new Date().toISOString(),
    };
    localStore.users.push(user);
    localStore.nextIds.users = 2;

    const client1 = {
      id: 1,
      user_id: 1,
      name: 'Sarah Jenkins',
      email: 'sarah@acmecorp.com',
      company: 'Acme Corporation',
      share_token: generateShareToken(),
      created_at: new Date().toISOString(),
    };
    const client2 = {
      id: 2,
      user_id: 1,
      name: 'Lukas Lindqvist',
      email: 'lukas@nordicdesign.co',
      company: 'Nordic Design Studio',
      share_token: generateShareToken(),
      created_at: new Date().toISOString(),
    };
    localStore.clients.push(client1, client2);
    localStore.nextIds.clients = 3;

    const proj1 = {
      id: 1,
      client_id: 1,
      title: 'Enterprise Billing Portal',
      description: 'Modern self-service subscription and invoicing web application with Stripe checkout and automated PDF invoices.',
      github_repo: 'facebook/react',
      status: 'active',
      deadline: '2026-11-15',
      created_at: new Date().toISOString(),
    };
    const proj2 = {
      id: 2,
      client_id: 2,
      title: 'E-Commerce Mobile Redesign',
      description: 'Mobile-first storefront with fast search, responsive product grids, and checkout flow.',
      github_repo: 'tailwindlabs/tailwindcss',
      status: 'active',
      deadline: '2026-12-01',
      created_at: new Date().toISOString(),
    };
    localStore.projects.push(proj1, proj2);
    localStore.nextIds.projects = 3;

    const tasksP1 = [
      { id: 1, project_id: 1, title: 'Design user authentication flow & session tokens', description: 'Ensure secure JWT issuance with refresh mechanism', status: 'done', priority: 'high', sort_order: 0, is_client_visible: true, due_date: '2026-10-10' },
      { id: 2, project_id: 1, title: 'Integrate Stripe Webhook listeners', description: 'Handle invoice.payment_succeeded and customer.subscription.updated', status: 'in_progress', priority: 'high', sort_order: 1, is_client_visible: true, due_date: '2026-10-18' },
      { id: 3, project_id: 1, title: 'Build client invoice PDF generator', description: 'Use server-side templating to produce branded invoices', status: 'review', priority: 'medium', sort_order: 2, is_client_visible: true, due_date: '2026-10-25' },
      { id: 4, project_id: 1, title: 'Configure Redis caching layer', description: 'Internal query performance tuning for transactions', status: 'todo', priority: 'low', sort_order: 3, is_client_visible: false, due_date: '2026-11-01' },
      { id: 5, project_id: 1, title: 'Implement multi-currency checkout modal', description: 'Support USD, EUR, GBP automatic conversion', status: 'todo', priority: 'medium', sort_order: 4, is_client_visible: true, due_date: '2026-11-08' },
    ];
    localStore.tasks.push(...tasksP1);
    localStore.nextIds.tasks = 6;

    saveLocalDb(localStore);
    console.log('[DB] Local development data store initialized with demo projects and clients.');
  }
};

export const getLocalStore = (): LocalDbStore => localStore;
export const updateLocalStore = (updater: (store: LocalDbStore) => void): void => {
  updater(localStore);
  saveLocalDb(localStore);
};

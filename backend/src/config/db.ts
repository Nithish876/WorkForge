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
  collaborators: any[];
  nextIds: {
    users: number;
    clients: number;
    projects: number;
    tasks: number;
    assets: number;
    collaborators: number;
  };
}

const LOCAL_DB_PATH = path.resolve(__dirname, '../../dev-database.json');

const loadLocalDb = (): LocalDbStore => {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      if (!parsed.collaborators) parsed.collaborators = [];
      if (!parsed.nextIds.collaborators) parsed.nextIds.collaborators = 1;
      return parsed;
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
    collaborators: [],
    nextIds: { users: 1, clients: 1, projects: 1, tasks: 1, assets: 1, collaborators: 1 },
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

    // Schema Blueprint
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        headline VARCHAR(200) NULL,
        bio TEXT NULL,
        location VARCHAR(100) NULL,
        website VARCHAR(255) NULL,
        github_username VARCHAR(100) NULL,
        twitter_username VARCHAR(100) NULL,
        linkedin_url VARCHAR(255) NULL,
        avatar_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add profile columns if users table existed previously without them
    const userCols = [
      'headline VARCHAR(200) NULL',
      'bio TEXT NULL',
      'location VARCHAR(100) NULL',
      'website VARCHAR(255) NULL',
      'github_username VARCHAR(100) NULL',
      'twitter_username VARCHAR(100) NULL',
      'linkedin_url VARCHAR(255) NULL',
      'avatar_url VARCHAR(500) NULL',
    ];
    for (const col of userCols) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col};`);
      } catch {
        // already exists
      }
    }

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
        user_id INT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        github_repo VARCHAR(255),
        status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
        deadline DATE,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    // Ensure is_public and user_id exist on projects
    try {
      await pool.query('ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT TRUE;');
    } catch {}
    try {
      await pool.query('ALTER TABLE projects ADD COLUMN user_id INT NULL;');
    } catch {}

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
        image_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    try {
      await pool.query('ALTER TABLE tasks ADD COLUMN image_url VARCHAR(500) NULL AFTER due_date;');
    } catch {}

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_collaborators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('contributor', 'viewer') DEFAULT 'contributor',
        status ENUM('pending', 'accepted', 'declined') DEFAULT 'accepted',
        invited_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_collab (project_id, user_id)
      );
    `);

    console.log('[DB] MySQL schema verified successfully.');
    await seedInitialDataMySQL();
  } catch (error: any) {
    console.warn('[DB] MySQL connection error detail:', error?.message || error);
    console.warn('[DB] Config used:', { host: env.db.host, port: env.db.port, user: env.db.user, passwordLen: env.db.password?.length });
    console.warn('[DB] Switching to persistent local storage adapter for seamless offline/dev operation.');
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
      `INSERT INTO users (name, email, password_hash, headline, bio, location, website, github_username, twitter_username, linkedin_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Alex Rivers',
        'alex@freelancer.io',
        hashed,
        'Principal Full-Stack Architect & Product Consultant',
        'Specializing in high-performance web applications, distributed APIs, and developer tools. 8+ years shipping client applications.',
        'San Francisco, CA',
        'https://alexrivers.dev',
        'alexrivers',
        'alexrivers_dev',
        'https://linkedin.com/in/alexrivers',
      ]
    );
    const userId = userResult.insertId;

    // Seed second user for collaboration demos
    const [user2Result]: any = await pool.query(
      `INSERT INTO users (name, email, password_hash, headline, bio, location, github_username)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Elena Rostova',
        'elena@workforge.dev',
        hashed,
        'Senior Frontend Engineer & UI Specialist',
        'Design systems advocate, React performance enthusiast, open-source contributor.',
        'Austin, TX',
        'elenarostova',
      ]
    );
    const user2Id = user2Result.insertId;

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
      'INSERT INTO projects (client_id, user_id, title, description, github_repo, status, deadline, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client1Id, userId, 'Enterprise Billing Portal', 'Modern self-service subscription and invoicing web application with Stripe checkout and automated PDF invoices.', 'facebook/react', 'active', '2026-11-15', true]
    );
    const proj1Id = proj1Result.insertId;

    const [proj2Result]: any = await pool.query(
      'INSERT INTO projects (client_id, user_id, title, description, github_repo, status, deadline, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client2Id, userId, 'E-Commerce Mobile Redesign', 'Mobile-first storefront with fast search, responsive product grids, and checkout flow.', 'tailwindlabs/tailwindcss', 'active', '2026-12-01', true]
    );
    const proj2Id = proj2Result.insertId;

    // Add Elena as collaborator on Project 1
    await pool.query(
      'INSERT INTO project_collaborators (project_id, user_id, role, status, invited_by) VALUES (?, ?, ?, ?, ?)',
      [proj1Id, user2Id, 'contributor', 'accepted', userId]
    );

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
  let needsSave = false;

  // Enrich demo user 1 with profile fields if missing
  if (localStore.users.length > 0) {
    const user1 = localStore.users.find((u) => u.id === 1);
    if (user1 && !user1.headline) {
      user1.headline = 'Principal Full-Stack Architect & Product Consultant';
      user1.bio = 'Specializing in high-performance web applications, distributed APIs, and developer tools. 8+ years shipping client applications.';
      user1.location = 'San Francisco, CA';
      user1.website = 'https://alexrivers.dev';
      user1.github_username = 'alexrivers';
      user1.twitter_username = 'alexrivers_dev';
      user1.linkedin_url = 'https://linkedin.com/in/alexrivers';
      needsSave = true;
    }
  }

  // Ensure user 2 exists for collaboration demo
  if (!localStore.users.find((u) => u.email === 'elena@workforge.dev')) {
    const hashed = await hashPassword('password123');
    localStore.users.push({
      id: localStore.nextIds.users++,
      name: 'Elena Rostova',
      email: 'elena@workforge.dev',
      password_hash: hashed,
      headline: 'Senior Frontend Engineer & UI Specialist',
      bio: 'Design systems advocate, React performance enthusiast, open-source contributor.',
      location: 'Austin, TX',
      website: 'https://elenarostova.io',
      github_username: 'elenarostova',
      twitter_username: 'elena_ui',
      linkedin_url: 'https://linkedin.com/in/elenarostova',
      created_at: new Date().toISOString(),
    });
    needsSave = true;
  }

  // Ensure projects have is_public and user_id
  localStore.projects.forEach((p) => {
    if (p.is_public === undefined) {
      p.is_public = true;
      needsSave = true;
    }
    if (!p.user_id) {
      p.user_id = 1;
      needsSave = true;
    }
  });

  // Ensure demo collaborator exists
  if (!localStore.collaborators) {
    localStore.collaborators = [];
  }
  if (localStore.collaborators.length === 0) {
    localStore.collaborators.push({
      id: localStore.nextIds.collaborators++,
      project_id: 1,
      user_id: 2,
      role: 'contributor',
      status: 'accepted',
      invited_by: 1,
      created_at: new Date().toISOString(),
    });
    needsSave = true;
  }

  if (needsSave) {
    saveLocalDb(localStore);
  }
};

export const getLocalStore = (): LocalDbStore => localStore;
export const updateLocalStore = (updater: (store: LocalDbStore) => void): void => {
  updater(localStore);
  saveLocalDb(localStore);
};

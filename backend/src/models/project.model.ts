import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { Project, ProjectStatus } from '../types';

export const findProjects = async (
  userId: number,
  clientId?: number
): Promise<Project[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    let query = `
      SELECT 
        p.*, 
        c.name AS client_name, 
        c.company AS client_company,
        COUNT(t.id) AS task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_task_count
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE c.user_id = ?
    `;
    const params: any[] = [userId];

    if (clientId) {
      query += ' AND p.client_id = ?';
      params.push(clientId);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [rows]: any = await pool.query(query, params);
    return rows.map((r: any) => {
      const taskCount = Number(r.task_count) || 0;
      const completed = Number(r.completed_task_count) || 0;
      const progress = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;
      return {
        ...r,
        task_count: taskCount,
        completed_task_count: completed,
        progress_percentage: progress,
      };
    });
  }

  const store = getLocalStore();
  const userClients = store.clients.filter((c) => c.user_id === userId);
  const userClientIds = userClients.map((c) => c.id);

  let filteredProjects = store.projects.filter((p) => userClientIds.includes(p.client_id));
  if (clientId) {
    filteredProjects = filteredProjects.filter((p) => p.client_id === clientId);
  }

  return filteredProjects.map((p) => {
    const client = userClients.find((c) => c.id === p.client_id);
    const tasks = store.tasks.filter((t) => t.project_id === p.id);
    const completedTasks = tasks.filter((t) => t.status === 'done');
    const taskCount = tasks.length;
    const completed = completedTasks.length;
    const progress = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;

    return {
      ...p,
      client_name: client?.name || 'Unknown Client',
      client_company: client?.company || null,
      task_count: taskCount,
      completed_task_count: completed,
      progress_percentage: progress,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const findProjectById = async (id: number): Promise<Project | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      `SELECT 
        p.*, 
        c.name AS client_name, 
        c.company AS client_company,
        COUNT(t.id) AS task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_task_count
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );

    if (!rows[0]) return null;
    const r = rows[0];
    const taskCount = Number(r.task_count) || 0;
    const completed = Number(r.completed_task_count) || 0;
    const progress = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;

    return {
      ...r,
      task_count: taskCount,
      completed_task_count: completed,
      progress_percentage: progress,
    };
  }

  const store = getLocalStore();
  const p = store.projects.find((proj) => proj.id === id);
  if (!p) return null;

  const client = store.clients.find((c) => c.id === p.client_id);
  const tasks = store.tasks.filter((t) => t.project_id === p.id);
  const completed = tasks.filter((t) => t.status === 'done').length;
  const taskCount = tasks.length;
  const progress = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;

  return {
    ...p,
    client_name: client?.name || 'Unknown Client',
    client_company: client?.company || null,
    task_count: taskCount,
    completed_task_count: completed,
    progress_percentage: progress,
  };
};

export const findProjectsByClientId = async (clientId: number): Promise<Project[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
    return rows;
  }

  const store = getLocalStore();
  return store.projects.filter((p) => p.client_id === clientId);
};

export const createProject = async (data: {
  client_id: number;
  title: string;
  description?: string | null;
  github_repo?: string | null;
  status?: ProjectStatus;
  deadline?: string | null;
}): Promise<Project> => {
  const status = data.status || 'active';

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      `INSERT INTO projects (client_id, title, description, github_repo, status, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.client_id,
        data.title.trim(),
        data.description?.trim() || null,
        data.github_repo?.trim() || null,
        status,
        data.deadline || null,
      ]
    );

    return (await findProjectById(result.insertId))!;
  }

  let created: Project | null = null;
  updateLocalStore((store) => {
    const id = store.nextIds.projects++;
    const now = new Date().toISOString();
    created = {
      id,
      client_id: data.client_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      github_repo: data.github_repo?.trim() || null,
      status,
      deadline: data.deadline || null,
      created_at: now,
      task_count: 0,
      completed_task_count: 0,
      progress_percentage: 0,
    };
    store.projects.unshift(created);
  });

  return (await findProjectById(created!.id))!;
};

export const updateProject = async (
  id: number,
  data: Partial<Project>
): Promise<Project | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title.trim());
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.github_repo !== undefined) {
      fields.push('github_repo = ?');
      values.push(data.github_repo ? data.github_repo.trim() : null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.deadline !== undefined) {
      fields.push('deadline = ?');
      values.push(data.deadline || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return findProjectById(id);
  }

  updateLocalStore((store) => {
    const p = store.projects.find((proj) => proj.id === id);
    if (p) {
      if (data.title !== undefined) p.title = data.title.trim();
      if (data.description !== undefined) p.description = data.description?.trim() || null;
      if (data.github_repo !== undefined) p.github_repo = data.github_repo?.trim() || null;
      if (data.status !== undefined) p.status = data.status;
      if (data.deadline !== undefined) p.deadline = data.deadline || null;
    }
  });

  return findProjectById(id);
};

export const deleteProject = async (id: number): Promise<boolean> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  let deleted = false;
  updateLocalStore((store) => {
    const initialLen = store.projects.length;
    store.projects = store.projects.filter((p) => p.id !== id);
    if (store.projects.length < initialLen) {
      deleted = true;
      store.tasks = store.tasks.filter((t) => t.project_id !== id);
      store.assets = store.assets.filter((a) => a.project_id !== id);
    }
  });

  return deleted;
};

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
        COUNT(DISTINCT t.id) AS task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_task_count,
        CASE 
          WHEN c.user_id = ? OR p.user_id = ? THEN 'owner'
          WHEN pc.role IS NOT NULL THEN pc.role
          ELSE 'owner'
        END AS user_role,
        (SELECT COUNT(*) FROM project_collaborators WHERE project_id = p.id) AS collaborators_count
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_collaborators pc ON pc.project_id = p.id AND pc.user_id = ?
      WHERE (c.user_id = ? OR p.user_id = ? OR pc.user_id = ?)
    `;
    const params: any[] = [userId, userId, userId, userId, userId, userId];

    if (clientId) {
      query += ' AND p.client_id = ?';
      params.push(clientId);
    }

    query += ' GROUP BY p.id, pc.role ORDER BY p.created_at DESC';

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
        user_role: r.user_role || 'owner',
        collaborators_count: Number(r.collaborators_count) || 0,
      };
    });
  }

  const store = getLocalStore();
  const userClients = store.clients.filter((c) => c.user_id === userId);
  const userClientIds = userClients.map((c) => c.id);

  // Find projects where user is owner or collaborator
  const userCollabs = (store.collaborators || []).filter((c) => c.user_id === userId && c.status === 'accepted');
  const collabProjectIds = userCollabs.map((c) => c.project_id);

  let filteredProjects = store.projects.filter(
    (p) => userClientIds.includes(p.client_id) || p.user_id === userId || collabProjectIds.includes(p.id)
  );

  if (clientId) {
    filteredProjects = filteredProjects.filter((p) => p.client_id === clientId);
  }

  return filteredProjects
    .map((p) => {
      const client = store.clients.find((c) => c.id === p.client_id);
      const tasks = store.tasks.filter((t) => t.project_id === p.id);
      const completedTasks = tasks.filter((t) => t.status === 'done');
      const taskCount = tasks.length;
      const completed = completedTasks.length;
      const progress = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;

      const isOwner = client?.user_id === userId || p.user_id === userId;
      const collabEntry = userCollabs.find((c) => c.project_id === p.id);
      const userRole = isOwner ? 'owner' : (collabEntry?.role || 'contributor');
      const collabsCount = (store.collaborators || []).filter((c) => c.project_id === p.id).length;

      return {
        ...p,
        client_name: client?.name || 'Unknown Client',
        client_company: client?.company || null,
        task_count: taskCount,
        completed_task_count: completed,
        progress_percentage: progress,
        user_role: userRole as any,
        collaborators_count: collabsCount,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const findProjectById = async (id: number): Promise<Project | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      `SELECT 
        p.*, 
        c.name AS client_name, 
        c.company AS client_company,
        c.user_id AS client_owner_id,
        COUNT(DISTINCT t.id) AS task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_task_count,
        (SELECT COUNT(*) FROM project_collaborators WHERE project_id = p.id) AS collaborators_count
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
      user_id: r.user_id || r.client_owner_id,
      task_count: taskCount,
      completed_task_count: completed,
      progress_percentage: progress,
      collaborators_count: Number(r.collaborators_count) || 0,
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
  const collabsCount = (store.collaborators || []).filter((c) => c.project_id === p.id).length;

  return {
    ...p,
    user_id: p.user_id || client?.user_id || 1,
    client_name: client?.name || 'Unknown Client',
    client_company: client?.company || null,
    task_count: taskCount,
    completed_task_count: completed,
    progress_percentage: progress,
    collaborators_count: collabsCount,
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
  user_id: number;
  title: string;
  description?: string | null;
  github_repo?: string | null;
  status?: ProjectStatus;
  deadline?: string | null;
  is_public?: boolean;
}): Promise<Project> => {
  const status = data.status || 'active';
  const isPublic = data.is_public !== undefined ? data.is_public : true;

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      `INSERT INTO projects (client_id, user_id, title, description, github_repo, status, deadline, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.client_id,
        data.user_id,
        data.title.trim(),
        data.description?.trim() || null,
        data.github_repo?.trim() || null,
        status,
        data.deadline || null,
        isPublic,
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
      user_id: data.user_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      github_repo: data.github_repo?.trim() || null,
      status,
      deadline: data.deadline || null,
      is_public: isPublic,
      created_at: now,
      task_count: 0,
      completed_task_count: 0,
      progress_percentage: 0,
      user_role: 'owner',
      collaborators_count: 0,
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
    if (data.is_public !== undefined) {
      fields.push('is_public = ?');
      values.push(Boolean(data.is_public));
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
      if (data.is_public !== undefined) p.is_public = Boolean(data.is_public);
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
      if (store.collaborators) {
        store.collaborators = store.collaborators.filter((c) => c.project_id !== id);
      }
    }
  });

  return deleted;
};

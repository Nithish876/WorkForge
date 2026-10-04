import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { ProjectCollaborator, CollaboratorRole, CollaboratorStatus } from '../types';

export const findProjectCollaborators = async (
  projectId: number
): Promise<ProjectCollaborator[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      `SELECT 
        pc.*, 
        u.name AS user_name, 
        u.email AS user_email, 
        u.headline AS user_headline, 
        u.avatar_url AS user_avatar
      FROM project_collaborators pc
      JOIN users u ON u.id = pc.user_id
      WHERE pc.project_id = ?
      ORDER BY pc.created_at ASC`,
      [projectId]
    );
    return rows;
  }

  const store = getLocalStore();
  const collabs = (store.collaborators || []).filter((c) => c.project_id === projectId);

  return collabs.map((c) => {
    const user = store.users.find((u) => u.id === c.user_id);
    return {
      ...c,
      user_name: user?.name || 'Unknown User',
      user_email: user?.email || '',
      user_headline: user?.headline || null,
      user_avatar: user?.avatar_url || null,
    };
  });
};

export const findCollaborator = async (
  projectId: number,
  userId: number
): Promise<ProjectCollaborator | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      'SELECT * FROM project_collaborators WHERE project_id = ? AND user_id = ? LIMIT 1',
      [projectId, userId]
    );
    return rows[0] || null;
  }

  const store = getLocalStore();
  const collab = (store.collaborators || []).find(
    (c) => c.project_id === projectId && c.user_id === userId
  );
  return collab || null;
};

export const addProjectCollaborator = async (data: {
  project_id: number;
  user_id: number;
  role?: CollaboratorRole;
  status?: CollaboratorStatus;
  invited_by: number;
}): Promise<ProjectCollaborator> => {
  const role = data.role || 'contributor';
  const status = data.status || 'accepted';

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      `INSERT INTO project_collaborators (project_id, user_id, role, status, invited_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), status = VALUES(status)`,
      [data.project_id, data.user_id, role, status, data.invited_by]
    );

    const insertedId = result.insertId;
    const [rows]: any = await pool.query(
      `SELECT 
        pc.*, 
        u.name AS user_name, 
        u.email AS user_email, 
        u.headline AS user_headline, 
        u.avatar_url AS user_avatar
      FROM project_collaborators pc
      JOIN users u ON u.id = pc.user_id
      WHERE pc.project_id = ? AND pc.user_id = ?`,
      [data.project_id, data.user_id]
    );
    return rows[0];
  }

  let created: ProjectCollaborator | null = null;
  updateLocalStore((store) => {
    if (!store.collaborators) store.collaborators = [];
    const existingIndex = store.collaborators.findIndex(
      (c) => c.project_id === data.project_id && c.user_id === data.user_id
    );

    const user = store.users.find((u) => u.id === data.user_id);

    if (existingIndex >= 0) {
      store.collaborators[existingIndex].role = role;
      store.collaborators[existingIndex].status = status;
      created = {
        ...store.collaborators[existingIndex],
        user_name: user?.name || 'Unknown User',
        user_email: user?.email || '',
        user_headline: user?.headline || null,
        user_avatar: user?.avatar_url || null,
      };
    } else {
      const id = store.nextIds.collaborators ? store.nextIds.collaborators++ : 1;
      const item = {
        id,
        project_id: data.project_id,
        user_id: data.user_id,
        role,
        status,
        invited_by: data.invited_by,
        created_at: new Date().toISOString(),
      };
      store.collaborators.push(item);
      created = {
        ...item,
        user_name: user?.name || 'Unknown User',
        user_email: user?.email || '',
        user_headline: user?.headline || null,
        user_avatar: user?.avatar_url || null,
      };
    }
  });

  return created!;
};

export const removeProjectCollaborator = async (
  projectId: number,
  userId: number
): Promise<boolean> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      'DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return result.affectedRows > 0;
  }

  let removed = false;
  updateLocalStore((store) => {
    if (!store.collaborators) return;
    const initialLen = store.collaborators.length;
    store.collaborators = store.collaborators.filter(
      (c) => !(c.project_id === projectId && c.user_id === userId)
    );
    removed = store.collaborators.length < initialLen;
  });

  return removed;
};

export const updateProjectCollaboratorRole = async (
  projectId: number,
  userId: number,
  role: CollaboratorRole
): Promise<boolean> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      'UPDATE project_collaborators SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, userId]
    );
    return result.affectedRows > 0;
  }

  let updated = false;
  updateLocalStore((store) => {
    if (!store.collaborators) return;
    const item = store.collaborators.find(
      (c) => c.project_id === projectId && c.user_id === userId
    );
    if (item) {
      item.role = role;
      updated = true;
    }
  });

  return updated;
};

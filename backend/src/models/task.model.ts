import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { Task, TaskPriority, TaskStatus } from '../types';

export const findTasksByProjectId = async (
  projectId: number,
  clientVisibleOnly = false
): Promise<Task[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    let query = 'SELECT * FROM tasks WHERE project_id = ?';
    const params: any[] = [projectId];

    if (clientVisibleOnly) {
      query += ' AND is_client_visible = TRUE';
    }

    query += ' ORDER BY sort_order ASC, id ASC';
    const [rows]: any = await pool.query(query, params);
    return rows.map((r: any) => ({
      ...r,
      is_client_visible: Boolean(r.is_client_visible),
    }));
  }

  const store = getLocalStore();
  let tasks = store.tasks.filter((t) => t.project_id === projectId);
  if (clientVisibleOnly) {
    tasks = tasks.filter((t) => t.is_client_visible);
  }
  return [...tasks].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
};

export const findTaskById = async (id: number): Promise<Task | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query('SELECT * FROM tasks WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    return {
      ...rows[0],
      is_client_visible: Boolean(rows[0].is_client_visible),
    };
  }

  const store = getLocalStore();
  const t = store.tasks.find((task) => task.id === id);
  return t ? { ...t } : null;
};

export const createTask = async (data: {
  project_id: number;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  sort_order?: number;
  is_client_visible?: boolean;
  due_date?: string | null;
}): Promise<Task> => {
  const status: TaskStatus = data.status || 'todo';
  const priority: TaskPriority = data.priority || 'medium';
  const sortOrder = data.sort_order !== undefined ? data.sort_order : 0;
  const isClientVisible = data.is_client_visible !== undefined ? data.is_client_visible : true;

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      `INSERT INTO tasks 
        (project_id, title, description, status, priority, sort_order, is_client_visible, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.title.trim(),
        data.description?.trim() || null,
        status,
        priority,
        sortOrder,
        isClientVisible,
        data.due_date || null,
      ]
    );

    return (await findTaskById(result.insertId))!;
  }

  let created: Task | null = null;
  updateLocalStore((store) => {
    const id = store.nextIds.tasks++;
    created = {
      id,
      project_id: data.project_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      status,
      priority,
      sort_order: sortOrder,
      is_client_visible: isClientVisible,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
    };
    store.tasks.push(created);
  });

  return created!;
};

export const updateTask = async (
  id: number,
  data: Partial<Task>
): Promise<Task | null> => {
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
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sort_order);
    }
    if (data.is_client_visible !== undefined) {
      fields.push('is_client_visible = ?');
      values.push(data.is_client_visible);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return findTaskById(id);
  }

  updateLocalStore((store) => {
    const t = store.tasks.find((task) => task.id === id);
    if (t) {
      if (data.title !== undefined) t.title = data.title.trim();
      if (data.description !== undefined) t.description = data.description?.trim() || null;
      if (data.status !== undefined) t.status = data.status;
      if (data.priority !== undefined) t.priority = data.priority;
      if (data.sort_order !== undefined) t.sort_order = data.sort_order;
      if (data.is_client_visible !== undefined) t.is_client_visible = data.is_client_visible;
      if (data.due_date !== undefined) t.due_date = data.due_date || null;
    }
  });

  return findTaskById(id);
};

export const updateTaskMovement = async (
  id: number,
  newStatus: TaskStatus,
  newSortOrder: number
): Promise<Task | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    await pool.query(
      'UPDATE tasks SET status = ?, sort_order = ? WHERE id = ?',
      [newStatus, newSortOrder, id]
    );
    return findTaskById(id);
  }

  updateLocalStore((store) => {
    const t = store.tasks.find((task) => task.id === id);
    if (t) {
      t.status = newStatus;
      t.sort_order = newSortOrder;
    }
  });

  return findTaskById(id);
};

export const reorderTasksBatch = async (
  items: Array<{ id: number; status: TaskStatus; sort_order: number }>
): Promise<void> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    for (const item of items) {
      await pool.query('UPDATE tasks SET status = ?, sort_order = ? WHERE id = ?', [
        item.status,
        item.sort_order,
        item.id,
      ]);
    }
    return;
  }

  updateLocalStore((store) => {
    for (const item of items) {
      const t = store.tasks.find((task) => task.id === item.id);
      if (t) {
        t.status = item.status;
        t.sort_order = item.sort_order;
      }
    }
  });
};

export const deleteTask = async (id: number): Promise<boolean> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  let deleted = false;
  updateLocalStore((store) => {
    const initialLen = store.tasks.length;
    store.tasks = store.tasks.filter((t) => t.id !== id);
    deleted = store.tasks.length < initialLen;
  });

  return deleted;
};

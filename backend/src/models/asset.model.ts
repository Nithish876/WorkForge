import { getPool, isMySQLActive, getLocalStore, updateLocalStore } from '../config/db';
import { Asset, UploadedBy } from '../types';

export const findAssetsByProjectId = async (projectId: number): Promise<Asset[]> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query(
      'SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    return rows;
  }

  const store = getLocalStore();
  return store.assets
    .filter((a) => a.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const findAssetById = async (id: number): Promise<Asset | null> => {
  if (isMySQLActive()) {
    const pool = getPool()!;
    const [rows]: any = await pool.query('SELECT * FROM assets WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  const store = getLocalStore();
  const a = store.assets.find((asset) => asset.id === id);
  return a ? { ...a } : null;
};

export const createAsset = async (data: {
  project_id: number;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: UploadedBy;
}): Promise<Asset> => {
  const uploadedBy = data.uploaded_by || 'freelancer';

  if (isMySQLActive()) {
    const pool = getPool()!;
    const [result]: any = await pool.query(
      `INSERT INTO assets 
        (project_id, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.original_name,
        data.file_path,
        data.file_size,
        data.mime_type,
        uploadedBy,
      ]
    );

    return (await findAssetById(result.insertId))!;
  }

  let created: Asset | null = null;
  updateLocalStore((store) => {
    const id = store.nextIds.assets++;
    created = {
      id,
      project_id: data.project_id,
      original_name: data.original_name,
      file_path: data.file_path,
      file_size: data.file_size,
      mime_type: data.mime_type,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    };
    store.assets.unshift(created);
  });

  return created!;
};

export const deleteAsset = async (id: number): Promise<Asset | null> => {
  const existing = await findAssetById(id);
  if (!existing) return null;

  if (isMySQLActive()) {
    const pool = getPool()!;
    await pool.query('DELETE FROM assets WHERE id = ?', [id]);
    return existing;
  }

  updateLocalStore((store) => {
    store.assets = store.assets.filter((a) => a.id !== id);
  });

  return existing;
};

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// Ensure root uploads folder exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

export const getUploadsRoot = (): string => UPLOADS_ROOT;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Project ID from route param or body
    const projectId = req.params.projectId || req.params.id || req.body.project_id || 'general';
    const targetDir = path.join(UPLOADS_ROOT, String(projectId));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

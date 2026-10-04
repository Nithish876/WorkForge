import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
const TASK_IMAGES_ROOT = path.join(UPLOADS_ROOT, 'tasks');

// Ensure root uploads and task images folders exist
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}
if (!fs.existsSync(TASK_IMAGES_ROOT)) {
  fs.mkdirSync(TASK_IMAGES_ROOT, { recursive: true });
}

export const getUploadsRoot = (): string => UPLOADS_ROOT;
export const getTaskImagesRoot = (): string => TASK_IMAGES_ROOT;

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

const taskImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TASK_IMAGES_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueName = `task_${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadTaskImageMiddleware = multer({
  storage: taskImageStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed for task image uploads'));
    }
  },
});

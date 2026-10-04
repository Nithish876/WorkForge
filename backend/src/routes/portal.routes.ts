import { Router } from 'express';
import { getPortalData, uploadClientPortalAsset } from '../controllers/portal.controller';
import { upload } from '../middlewares/upload.middleware';

export const portalRouter = Router();

// Public zero-login portal routes accessed via client share_token
portalRouter.get('/:shareToken', getPortalData);
portalRouter.post('/:shareToken/projects/:projectId/assets', upload.single('file'), uploadClientPortalAsset);

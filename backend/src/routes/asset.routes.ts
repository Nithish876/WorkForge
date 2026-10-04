import { Router } from 'express';
import { downloadAsset, deleteExistingAsset } from '../controllers/asset.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const assetRouter = Router();

// Secure download (supports Bearer JWT, ?token= JWT, or ?share_token= Client Portal token)
assetRouter.get('/:id/download', downloadAsset);

// Delete requires freelancer login
assetRouter.delete('/:id', authenticate, deleteExistingAsset);

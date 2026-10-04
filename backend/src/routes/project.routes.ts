import { Router } from 'express';
import {
  getProjects,
  getProject,
  createNewProject,
  updateExistingProject,
  deleteExistingProject,
  getProjectCommits,
} from '../controllers/project.controller';
import {
  getProjectCollaboratorsList,
  inviteCollaboratorToProject,
  removeCollaboratorFromProject,
  updateCollaboratorRoleInProject,
} from '../controllers/collaborator.controller';
import { getTasks, createNewTask } from '../controllers/task.controller';
import { getProjectAssets, uploadProjectAsset } from '../controllers/asset.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProject);
projectRouter.post('/', createNewProject);
projectRouter.patch('/:id', updateExistingProject);
projectRouter.put('/:id', updateExistingProject);
projectRouter.delete('/:id', deleteExistingProject);

// Collaborator management routes (owner permission enforced)
projectRouter.get('/:id/collaborators', getProjectCollaboratorsList);
projectRouter.post('/:id/collaborators', inviteCollaboratorToProject);
projectRouter.delete('/:id/collaborators/:userId', removeCollaboratorFromProject);
projectRouter.put('/:id/collaborators/:userId', updateCollaboratorRoleInProject);

// Nested routes per plan.md
projectRouter.get('/:id/github-commits', getProjectCommits);
projectRouter.get('/:projectId/tasks', getTasks);
projectRouter.post('/:projectId/tasks', createNewTask);
projectRouter.get('/:projectId/assets', getProjectAssets);
projectRouter.post('/:projectId/assets', upload.single('file'), uploadProjectAsset);

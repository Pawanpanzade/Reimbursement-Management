import { Router } from 'express';

import { extractJWT, requireAuth, requireRole } from '../../middlewares/auth.middleware';
import {
  createUserHandler,
  deleteUserHandler,
  getAllUsersHandler,
  getHierarchyHandler,
  getUserByIdHandler,
  updateUserHandler,
} from './users.controller';

const usersRouter = Router();

usersRouter.use(extractJWT, requireAuth, requireRole('admin'));

usersRouter.post('/', createUserHandler);
usersRouter.get('/', getAllUsersHandler);
usersRouter.get('/hierarchy', getHierarchyHandler);
usersRouter.get('/:id', getUserByIdHandler);
usersRouter.patch('/:id', updateUserHandler);
usersRouter.delete('/:id', deleteUserHandler);

export { usersRouter };

import { Router } from 'express';
import { extractJWT, requireAuth } from '../../middlewares/auth.middleware';
import { getPendingApprovalsHandler, approveRejectHandler } from './approval.controller';

const approvalsRouter = Router();

approvalsRouter.use(extractJWT, requireAuth);

approvalsRouter.get('/pending', getPendingApprovalsHandler);
approvalsRouter.post('/:taskId/action', approveRejectHandler);

export { approvalsRouter };

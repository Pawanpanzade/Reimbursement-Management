import { Router } from 'express';

import { extractJWT, requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { createApprovalConfigHandler } from './approval-config.controller';

const approvalConfigRouter = Router();

approvalConfigRouter.use(extractJWT, requireAuth, requireRole('admin'));
approvalConfigRouter.post('/', createApprovalConfigHandler);

export { approvalConfigRouter };

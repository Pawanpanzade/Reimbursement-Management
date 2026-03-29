import { Router } from 'express';

import { extractJWT, requireAuth } from '../../middlewares/auth.middleware';
import { loginHandler, meHandler, signupHandler } from './auth.controller';

const authRouter = Router();

authRouter.post('/signup', signupHandler);
authRouter.post('/login', loginHandler);
authRouter.get('/me', extractJWT, requireAuth, meHandler);

export { authRouter };

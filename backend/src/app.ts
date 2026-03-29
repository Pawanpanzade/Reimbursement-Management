import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { expensesRouter } from './modules/expenses/expenses.routes';
import { usersRouter } from './modules/users/users.routes';
import { approvalsRouter } from './modules/approvals/approval.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const apiV1Router = express.Router();

apiV1Router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/expenses', expensesRouter);
apiV1Router.use('/approvals', approvalsRouter);
apiV1Router.use('/users', usersRouter);

app.use('/api/v1', apiV1Router);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error('Route not found') as Error & { statusCode?: number };
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

export default app;

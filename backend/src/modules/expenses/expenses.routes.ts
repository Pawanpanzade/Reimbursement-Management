import { Router } from 'express';

import { extractJWT, requireAuth } from '../../middlewares/auth.middleware';
import {
  getExpenseByIdHandler,
  getMyExpensesHandler,
  submitExpenseHandler,
} from './expenses.controller';

const expensesRouter = Router();

expensesRouter.use(extractJWT, requireAuth);

expensesRouter.post('/', submitExpenseHandler);
expensesRouter.get('/my', getMyExpensesHandler);
expensesRouter.get('/:id', getExpenseByIdHandler);

export { expensesRouter };

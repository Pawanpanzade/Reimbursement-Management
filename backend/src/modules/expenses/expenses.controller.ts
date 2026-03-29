import { NextFunction, Request, Response } from 'express';

import { getExpenseById, getMyExpenses, submitExpense } from './expenses.service';

export const submitExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const expense = await submitExpense(req.user.companyId, req.user.id, {
      amount: Number(req.body.amount),
      currency: String(req.body.currency ?? ''),
      category: req.body.category !== undefined ? String(req.body.category) : undefined,
      description: String(req.body.description ?? ''),
      date: String(req.body.date ?? ''),
      receiptUrl: req.body.receiptUrl !== undefined ? String(req.body.receiptUrl) : undefined,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyExpensesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status ? String(req.query.status).toLowerCase() : undefined;

    const result = await getMyExpenses(req.user.companyId, req.user.id, {
      page,
      limit,
      status: status as 'pending' | 'approved' | 'rejected' | undefined,
    });

    res.status(200).json({
      success: true,
      data: result.expenses,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const expense = await getExpenseById(
      req.user.companyId,
      req.user.id,
      req.user.role,
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

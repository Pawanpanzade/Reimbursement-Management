import { NextFunction, Request, Response } from 'express';

import { createApprovalConfig } from './approval-config.service';

export const createApprovalConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const result = await createApprovalConfig(req.user.companyId, {
      steps: req.body.steps,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

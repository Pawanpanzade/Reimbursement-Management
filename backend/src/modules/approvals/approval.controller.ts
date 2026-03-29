import { Request, Response, NextFunction } from 'express';
import { handleApprovalAction, getPendingApprovals } from './approval.service';

export const getPendingApprovalsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const user = req.user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getPendingApprovals(user.companyId, user.id, { page, limit });

    res.status(200).json({
      success: true,
      data: result.approvals,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRejectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const user = req.user;
    const taskId = String(req.params.taskId);
    const { action, comment } = req.body;

    const task = await handleApprovalAction(user.companyId, user.id, taskId, {
      action: String(action).toLowerCase() as 'approve' | 'reject',
      comment,
    });

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

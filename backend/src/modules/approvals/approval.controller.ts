import { Request, Response, NextFunction } from 'express';
import { handleApprovalAction, getPendingApprovals } from './approval.service';
import { AuthUser } from '../../types/express';

export const getPendingApprovalsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUser;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getPendingApprovals(user.id, { page, limit });

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
    const user = req.user as AuthUser;
    const { taskId } = req.params;
    const { action, comment } = req.body;

    const task = await handleApprovalAction(user.companyId, user.id, taskId, {
      action,
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

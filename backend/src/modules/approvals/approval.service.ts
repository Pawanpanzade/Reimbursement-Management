import { prisma } from '../../config/db';
import { AppError } from '../../utils/app-error';

type ApprovalAction = 'approve' | 'reject';

type HandleApprovalActionInput = {
  action: ApprovalAction;
  comment?: string;
};

type PendingApprovalsQuery = {
  page: number;
  limit: number;
};

type ApprovalTaskRecord = {
  id: string;
  expenseId: string;
  approverId: string;
  step: number;
  status: string;
  comment: string | null;
  actedAt: Date | null;
  createdAt: Date;
};

type ApprovalWithDetails = {
  id: string;
  expenseId: string;
  approverId: string;
  step: number;
  status: string;
  comment: string | null;
  actedAt: Date | null;
  createdAt: Date;
  expense: {
    id: string;
    companyId: string;
    employeeId: string;
    submittedAmount: number;
    submittedCurrency: string;
    convertedAmount: number;
    companyCurrency: string;
    category: string | null;
    description: string;
    date: Date;
    receiptUrl: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    employee: {
      id: string;
      name: string;
      email: string;
    };
  };
};

type PaginatedPendingApprovals = {
  approvals: ApprovalWithDetails[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const createApprovalTask = async (
  expenseId: string,
  approverId: string,
  step: number,
): Promise<ApprovalTaskRecord> => {
  const task = await prisma.approvalTask.create({
    data: {
      expenseId,
      approverId,
      step,
      status: 'pending',
    },
  });

  return task;
};

export const getPendingApprovals = async (
  companyId: string,
  approverId: string,
  query: PendingApprovalsQuery,
): Promise<PaginatedPendingApprovals> => {
  const page = Number.isInteger(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isInteger(query.limit) && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const where = {
    approverId,
    status: 'pending',
    expense: {
      companyId,
    },
  };

  const [total, approvals] = await Promise.all([
    prisma.approvalTask.count({ where }),
    prisma.approvalTask.findMany({
      where,
      include: {
        expense: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    approvals,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const handleApprovalAction = async (
  companyId: string,
  approverId: string,
  taskId: string,
  input: HandleApprovalActionInput,
): Promise<ApprovalTaskRecord> => {
  const { action, comment } = input;

  if (!['approve', 'reject'].includes(action)) {
    throw new AppError(400, 'action must be approve or reject.');
  }

  // Find task
  const task = await prisma.approvalTask.findUnique({
    where: { id: taskId },
    include: { expense: true },
  });

  if (!task) {
    throw new AppError(404, 'ApprovalTask not found.');
  }

  // Verify task belongs to current user
  if (task.approverId !== approverId) {
    throw new AppError(403, 'You are not assigned to this task.');
  }

  // Verify task is still pending
  if (task.status !== 'pending') {
    throw new AppError(400, `Task is already ${task.status}.`);
  }

  // Verify company isolation
  if (task.expense.companyId !== companyId) {
    throw new AppError(403, 'Expense does not belong to your company.');
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  if (task.expense.currentStep !== null && task.step !== task.expense.currentStep) {
    throw new AppError(400, 'This task is not the current approval step.');
  }

  const updatedTask = await prisma.$transaction(
    async (tx: {
      approvalTask: typeof prisma.approvalTask;
      approvalConfig: typeof prisma.approvalConfig;
      approvalStep: typeof prisma.approvalStep;
      expense: typeof prisma.expense;
    }) => {
      const updated = await tx.approvalTask.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          comment: comment || null,
          actedAt: new Date(),
        },
      });

      if (action === 'reject') {
        await tx.expense.update({
          where: { id: task.expenseId },
          data: {
            status: 'rejected',
            updatedAt: new Date(),
          },
        });

        return updated;
      }

      const config = await tx.approvalConfig.findUnique({
        where: { companyId: companyId },
        select: { id: true },
      });

      if (!config) {
        await tx.expense.update({
          where: { id: task.expenseId },
          data: {
            status: 'approved',
            updatedAt: new Date(),
          },
        });

        return updated;
      }

      const nextStep = await tx.approvalStep.findFirst({
        where: {
          configId: config.id,
          stepOrder: {
            gt: task.step,
          },
        },
        orderBy: {
          stepOrder: 'asc',
        },
      });

      if (nextStep) {
        await tx.expense.update({
          where: { id: task.expenseId },
          data: {
            status: 'pending_approval',
            currentStep: nextStep.stepOrder,
            updatedAt: new Date(),
          },
        });

        await tx.approvalTask.create({
          data: {
            expenseId: task.expenseId,
            approverId: nextStep.approverId,
            step: nextStep.stepOrder,
            status: 'pending',
          },
        });
      } else {
        await tx.expense.update({
          where: { id: task.expenseId },
          data: {
            status: 'approved',
            updatedAt: new Date(),
          },
        });
      }

      return updated;
    },
  );

  return updatedTask;
};

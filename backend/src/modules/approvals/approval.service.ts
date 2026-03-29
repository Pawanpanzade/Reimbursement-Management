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
  status: string;
  comment: string | null;
  actedAt: Date | null;
  createdAt: Date;
};

type ApprovalWithDetails = {
  id: string;
  expenseId: string;
  approverId: string;
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
): Promise<ApprovalTaskRecord> => {
  const task = await prisma.approvalTask.create({
    data: {
      expenseId,
      approverId,
      status: 'pending',
    },
  });

  return task;
};

export const getPendingApprovals = async (
  approverId: string,
  query: PendingApprovalsQuery,
): Promise<PaginatedPendingApprovals> => {
  const page = Number.isInteger(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isInteger(query.limit) && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const where = {
    approverId,
    status: 'pending',
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
  const expenseStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update task and expense in transaction
  const updatedTask = await prisma.$transaction(async (tx: { approvalTask: typeof prisma.approvalTask; expense: typeof prisma.expense }) => {
    const updated = await tx.approvalTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        comment: comment || null,
        actedAt: new Date(),
      },
    });

    await tx.expense.update({
      where: { id: task.expenseId },
      data: {
        status: expenseStatus,
        updatedAt: new Date(),
      },
    });

    return updated;
  });

  return updatedTask;
};

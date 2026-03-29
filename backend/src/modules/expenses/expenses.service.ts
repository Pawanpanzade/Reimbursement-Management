import { prisma } from '../../config/db';
import { AppError } from '../../utils/app-error';
import { getConversionRate } from './currency.service';

type ExpenseStatus = 'pending_approval' | 'approved' | 'rejected';

type SubmitExpenseInput = {
  amount: number;
  currency: string;
  category?: string;
  description: string;
  date: string;
  receiptUrl?: string;
};

type GetMyExpensesQuery = {
  page: number;
  limit: number;
  status?: ExpenseStatus;
};

type ExpenseRecord = {
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
};

type PaginatedExpenses = {
  expenses: ExpenseRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const validStatuses: ExpenseStatus[] = ['pending_approval', 'approved', 'rejected'];

const normalizeCurrency = (value: string): string => {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new AppError(400, 'Invalid currency.');
  }

  return normalized;
};

const parseExpenseDate = (value: string): Date => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, 'Invalid date. Use ISO format, e.g. 2024-10-15.');
  }

  return parsedDate;
};

export const submitExpense = async (
  companyId: string,
  employeeId: string,
  input: SubmitExpenseInput,
): Promise<ExpenseRecord> => {
  const amount = Number(input.amount);
  const submittedCurrency = normalizeCurrency(String(input.currency ?? ''));
  const description = String(input.description ?? '').trim();
  const category = input.category ? String(input.category).trim() : null;
  const receiptUrl = input.receiptUrl ? String(input.receiptUrl).trim() : null;
  const date = parseExpenseDate(String(input.date ?? ''));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, 'amount must be a positive number.');
  }

  if (!description) {
    throw new AppError(400, 'description is required.');
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, currency: true },
  });

  if (!company) {
    throw new AppError(404, 'Company not found.');
  }

  const companyCurrency = normalizeCurrency(company.currency);
  const rate = await getConversionRate(submittedCurrency, companyCurrency);
  const convertedAmount = Number((amount * rate).toFixed(2));

  // Create expense in transaction with approval task
  const expense = await prisma.$transaction(
    async (tx: { expense: typeof prisma.expense; user: typeof prisma.user; approvalTask: typeof prisma.approvalTask }) => {
    const newExpense = await tx.expense.create({
      data: {
        companyId,
        employeeId,
        submittedAmount: amount,
        submittedCurrency,
        convertedAmount,
        companyCurrency,
        category,
        description,
        date,
        receiptUrl,
        status: 'pending_approval',
      },
    });

    // Fetch employee's manager
    const employee = await tx.user.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });

    // Create approval task if manager exists
    if (employee?.managerId) {
      await tx.approvalTask.create({
        data: {
          expenseId: newExpense.id,
          approverId: employee.managerId,
          status: 'pending',
        },
      });
    }

    return newExpense;
    },
  );

  return expense;
};

export const getMyExpenses = async (
  companyId: string,
  employeeId: string,
  query: GetMyExpensesQuery,
): Promise<PaginatedExpenses> => {
  const page = Number.isInteger(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isInteger(query.limit) && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const where: {
    companyId: string;
    employeeId: string;
    status?: ExpenseStatus;
  } = {
    companyId,
    employeeId,
  };

  if (query.status) {
    if (!validStatuses.includes(query.status)) {
      throw new AppError(400, 'status must be pending_approval, approved, or rejected.');
    }
    where.status = query.status;
  }

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    expenses,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const getExpenseById = async (
  companyId: string,
  userId: string,
  role: string,
  expenseId: string,
): Promise<ExpenseRecord> => {
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      companyId,
    },
  });

  if (!expense) {
    throw new AppError(404, 'Expense not found.');
  }

  if (role !== 'admin' && expense.employeeId !== userId) {
    throw new AppError(403, 'Forbidden.');
  }

  return expense;
};

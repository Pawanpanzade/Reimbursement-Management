import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcrypt';

import { prisma } from '../../config/db';
import { AppError } from '../../utils/app-error';

const SALT_ROUNDS = 12;

type UserRole = 'employee' | 'manager';

type ManagerSummary = {
  id: string;
  name: string;
};

type UserResponse = Omit<User, 'password'> & {
  manager: ManagerSummary | null;
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: string;
};

type GetUsersInput = {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
};

type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  managerId?: string | null;
  isActive?: boolean;
};

type PaginatedUsersResult = {
  users: UserResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type HierarchyNode = {
  id: string;
  name: string;
  role: string;
  reports: Array<{
    id: string;
    name: string;
    role: string;
  }>;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...safeUser } = user;
  void password;
  return safeUser;
};

const attachManagerInfo = async (companyId: string, users: User[]): Promise<UserResponse[]> => {
  const managerIds = Array.from(new Set(users.map((user) => user.managerId).filter((id): id is string => Boolean(id))));

  const managers = managerIds.length
    ? await prisma.user.findMany({
        where: {
          id: { in: managerIds },
          companyId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : [];

  const managerMap = new Map<string, ManagerSummary>(managers.map((manager) => [manager.id, manager]));

  return users.map((user) => ({
    ...sanitizeUser(user),
    manager: user.managerId ? (managerMap.get(user.managerId) ?? null) : null,
  }));
};

const validateManager = async (companyId: string, managerId: string, userIdToExclude?: string): Promise<void> => {
  if (userIdToExclude && managerId === userIdToExclude) {
    throw new AppError(400, 'A user cannot be their own manager.');
  }

  const manager = await prisma.user.findFirst({
    where: {
      id: managerId,
      companyId,
      role: 'manager',
      isActive: true,
    },
  });

  if (!manager) {
    throw new AppError(400, 'managerId must reference an active manager in the same company.');
  }
};

const normalizeRole = (role: string): UserRole => {
  if (role !== 'employee' && role !== 'manager') {
    throw new AppError(400, 'role must be either employee or manager.');
  }

  return role;
};

const ensureUniqueEmailInCompany = async (companyId: string, email: string, excludeUserId?: string): Promise<void> => {
  const existing = await prisma.user.findFirst({
    where: {
      companyId,
      email,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new AppError(409, 'Email already exists in this company.');
  }
};

export const createUser = async (companyId: string, input: CreateUserInput): Promise<UserResponse> => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role = normalizeRole(input.role);
  const managerId = input.managerId?.trim();

  if (!name || !email || !password) {
    throw new AppError(400, 'name, email, password and role are required.');
  }

  if (!isValidEmail(email)) {
    throw new AppError(400, 'Invalid email format.');
  }

  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters long.');
  }

  if (role === 'employee' && !managerId) {
    throw new AppError(400, 'managerId is required when role is employee.');
  }

  if (role === 'employee' && managerId) {
    await validateManager(companyId, managerId);
  }

  await ensureUniqueEmailInCompany(companyId, email);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId,
        managerId: role === 'employee' ? managerId : null,
      },
    });

    const userWithManager = await attachManagerInfo(companyId, [user]);
    return userWithManager[0];
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Email already exists in this company.');
    }

    throw error;
  }
};

export const getAllUsers = async (companyId: string, query: GetUsersInput): Promise<PaginatedUsersResult> => {
  const page = Number.isInteger(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isInteger(query.limit) && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const where: Prisma.UserWhereInput = {
    companyId,
  };

  if (query.role) {
    where.role = query.role;
  }

  if (query.search) {
    where.OR = [
      {
        name: {
          contains: query.search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: query.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const usersWithManagers = await attachManagerInfo(companyId, users);

  return {
    users: usersWithManagers,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (companyId: string, userId: string): Promise<UserResponse> => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const usersWithManagers = await attachManagerInfo(companyId, [user]);
  return usersWithManagers[0];
};

export const updateUser = async (companyId: string, userId: string, input: UpdateUserInput): Promise<UserResponse> => {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found.');
  }

  const nextRole: string = input.role ?? existingUser.role;

  if (nextRole !== 'admin' && nextRole !== 'employee' && nextRole !== 'manager') {
    throw new AppError(400, 'role must be admin, employee or manager.');
  }

  let nextManagerId: string | null =
    input.managerId !== undefined ? input.managerId : (existingUser.managerId ?? null);

  if (nextRole === 'employee') {
    if (!nextManagerId) {
      throw new AppError(400, 'managerId is required when role is employee.');
    }

    await validateManager(companyId, nextManagerId, existingUser.id);
  }

  if (nextRole === 'manager' || nextRole === 'admin') {
    nextManagerId = null;
  }

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new AppError(400, 'name cannot be empty.');
    }
    data.name = trimmedName;
  }

  if (input.role !== undefined) {
    data.role = nextRole;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  if (input.managerId !== undefined || nextRole !== existingUser.role) {
    data.managerId = nextManagerId;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data,
  });

  const usersWithManagers = await attachManagerInfo(companyId, [updatedUser]);
  return usersWithManagers[0];
};

export const softDeleteUser = async (companyId: string, userId: string): Promise<UserResponse> => {
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found.');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      isActive: false,
    },
  });

  const usersWithManagers = await attachManagerInfo(companyId, [updatedUser]);
  return usersWithManagers[0];
};

export const getHierarchy = async (companyId: string): Promise<HierarchyNode[]> => {
  const managers = await prisma.user.findMany({
    where: {
      companyId,
      role: 'manager',
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  const managerIds = managers.map((manager) => manager.id);

  const employees = managerIds.length
    ? await prisma.user.findMany({
        where: {
          companyId,
          role: 'employee',
          isActive: true,
          managerId: {
            in: managerIds,
          },
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          role: true,
          managerId: true,
        },
      })
    : [];

  const reportsByManager = new Map<string, Array<{ id: string; name: string; role: string }>>();

  employees.forEach((employee) => {
    if (!employee.managerId) {
      return;
    }

    const currentReports = reportsByManager.get(employee.managerId) ?? [];
    currentReports.push({
      id: employee.id,
      name: employee.name,
      role: employee.role,
    });
    reportsByManager.set(employee.managerId, currentReports);
  });

  return managers.map((manager) => ({
    id: manager.id,
    name: manager.name,
    role: manager.role,
    reports: reportsByManager.get(manager.id) ?? [],
  }));
};

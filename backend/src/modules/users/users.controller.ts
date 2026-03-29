import { NextFunction, Request, Response } from 'express';

import {
  createUser,
  getAllUsers,
  getHierarchy,
  getUserById,
  softDeleteUser,
  updateUser,
} from './users.service';

const parseRole = (value: unknown): 'employee' | 'manager' | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'employee' || value === 'manager') {
    return value;
  }

  return undefined;
};

export const createUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const user = await createUser(companyId, {
      name: String(req.body.name ?? ''),
      email: String(req.body.email ?? ''),
      password: String(req.body.password ?? ''),
      role: String(req.body.role ?? '') as 'employee' | 'manager',
      managerId: req.body.managerId ? String(req.body.managerId) : undefined,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const role = parseRole(req.query.role);
    const search = req.query.search ? String(req.query.search) : undefined;

    const result = await getAllUsers(companyId, { page, limit, role, search });

    res.status(200).json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const userId = String(req.params.id);
    const user = await getUserById(companyId, userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const role = parseRole(req.body.role);

    const userId = String(req.params.id);
    const user = await updateUser(companyId, userId, {
      name: req.body.name !== undefined ? String(req.body.name) : undefined,
      role,
      managerId:
        req.body.managerId !== undefined
          ? req.body.managerId === null
            ? null
            : String(req.body.managerId)
          : undefined,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const userId = String(req.params.id);
    const user = await softDeleteUser(companyId, userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getHierarchyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const hierarchy = await getHierarchy(companyId);

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    next(error);
  }
};

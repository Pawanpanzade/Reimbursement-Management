import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/app-error';

type TokenPayload = JwtPayload & {
  sub: string;
  companyId: string;
  role: string;
  email: string;
};

const parseBearerToken = (authorizationHeader: string): string => {
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Invalid token.');
  }

  return token;
};

export const extractJWT = (req: Request, _res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    next();
    return;
  }

  try {
    const token = parseBearerToken(authorizationHeader);
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded === 'string') {
      throw new AppError(401, 'Invalid token.');
    }

    const payload = decoded as TokenPayload;

    if (!payload.sub || !payload.companyId || !payload.role || !payload.email) {
      throw new AppError(401, 'Invalid token.');
    }

    req.user = {
      id: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    next(new AppError(401, 'Invalid token.'));
  }
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new AppError(401, 'Unauthorized.'));
    return;
  }

  next();
};

export const requireRole = (role: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Unauthorized.'));
      return;
    }

    if (req.user.role !== role) {
      next(new AppError(403, 'Forbidden.'));
      return;
    }

    next();
  };
};

export const authMiddleware = requireAuth;

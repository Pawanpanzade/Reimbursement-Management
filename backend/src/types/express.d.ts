import 'express';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      companyId: string;
      role: string;
      email: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};

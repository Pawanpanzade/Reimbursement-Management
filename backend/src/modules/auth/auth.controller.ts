import { NextFunction, Request, Response } from 'express';

import { login, signup } from './auth.service';

export const signupHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await signup({
      name: String(req.body.name ?? ''),
      email: String(req.body.email ?? ''),
      password: String(req.body.password ?? ''),
      country: String(req.body.country ?? ''),
    });

    res.status(201).json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        company: result.company,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login({
      email: String(req.body.email ?? ''),
      password: String(req.body.password ?? ''),
    });

    res.status(200).json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const meHandler = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string | number;
        user_name: string;
        email?: string;
        role?: number | string;
      };
    }
  }
}


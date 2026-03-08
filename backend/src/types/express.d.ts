import "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        user_id: number;
        user_name: string,
        role?: string;
      };
    }
  }
}

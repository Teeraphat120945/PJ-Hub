import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "classroom_jwt_secret_key_2026";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as NonNullable<Request["user"]>;

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware สำหรับตรวจสอบ Role ของผู้ใช้งาน
 * @param allowedRoles รายการ Role ที่ได้รับอนุญาต (เช่น 0 = Admin, 1 = Teacher, 2 = Student)
 */
export const authorizeRoles = (...allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    const userRole = Number(req.user.role);
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ในการเข้าถึงทรัพยากรนี้ (Forbidden)",
      });
    }

    next();
  };
};

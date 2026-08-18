import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: number[];
  requireAuth?: boolean;
}

/**
 * Route Guard Component เพื่อตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บ (Authentication & RBAC)
 * - หากยังไม่ Login: Redirect ไปยัง /login พร้อมแสดงแจ้งเตือน
 * - หากสิทธิ์ (Role) ไม่ถึง: Redirect กลับไปยัง / พร้อมแจ้งเตือนว่าไม่มีสิทธิ์
 * - หากเป็นหน้า Guest-only (requireAuth = false): หาก Login อยู่แล้วจะ Redirect ไปยัง /
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const role = storedRole !== null && storedRole !== undefined ? Number(storedRole) : null;

  const warnedRef = useRef(false);

  useEffect(() => {
    if (requireAuth) {
      if (!token && !warnedRef.current) {
        warnedRef.current = true;
        toast.warn("กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้");
      } else if (
        token &&
        allowedRoles &&
        allowedRoles.length > 0 &&
        role !== null &&
        !allowedRoles.includes(role) &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Access Denied)");
      }
    }
  }, [token, role, allowedRoles, requireAuth]);

  // กรณีหน้าที่ต้องเข้าสู่ระบบก่อน
  if (requireAuth) {
    if (!token) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (role === null || !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
      }
    }
  } else {
    // กรณีหน้าสำหรับผู้ที่ยังไม่ล็อกอิน เช่น /login หรือ /register
    if (token) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : null;
};

export default ProtectedRoute;

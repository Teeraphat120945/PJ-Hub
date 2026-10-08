import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: number[];
  requireAuth?: boolean;
}

const isTokenExpired = (rawToken: string | null): boolean => {
  if (!rawToken) return true;
  try {
    const parts = rawToken.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Route Guard Component เพื่อตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บ (Authentication & RBAC)
 * - หากยังไม่ Login หรือ Token หมดอายุ: Redirect ไปยัง /login พร้อมแสดงแจ้งเตือน
 * - หากสิทธิ์ (Role) ไม่ถึง: Redirect กลับไปยัง / พร้อมแจ้งเตือนว่าไม่มีสิทธิ์
 * - หากเป็นหน้า Guest-only (requireAuth = false): หาก Login อยู่แล้วจะ Redirect ไปยัง /
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const location = useLocation();
  const rawToken = localStorage.getItem("token");
  const isExpired = isTokenExpired(rawToken);

  let token = rawToken;
  if (rawToken && isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("role_flg");
    token = null;
  }

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
    // หากกำลัง redirect กลับมาจาก OAuth (มี query token หรือ oauth) ให้ยอมผ่านเข้าหน้า Login เพื่อบันทึก Token ก่อน
    const searchParams = new URLSearchParams(location.search);
    const isOAuthCallback = searchParams.has("token") || searchParams.has("oauth");

    if (token && !isOAuthCallback) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : null;
};

export default ProtectedRoute;

export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * ดึง Header สำหรับ Authentication (Bearer token)
 */
export const getAuthHeader = (additionalHeaders: HeadersInit = {}): HeadersInit => {
  const token = localStorage.getItem("token");
  if (!token) {
    return { ...additionalHeaders };
  }
  return {
    Authorization: `Bearer ${token}`,
    ...additionalHeaders,
  };
};

/**
 * ล้างข้อมูล Session ทั้งหมดเมื่อ Token หมดอายุหรือไม่ถูกต้อง
 */
export const handleUnauthorized = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_id");
  localStorage.removeItem("role");
  localStorage.removeItem("role_flg");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login?expired=1";
  }
};

/**
 * Wrapper สำหรับ fetch ที่ดักจับ 401 Unauthorized อัตโนมัติ
 */
export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const res = await fetch(input, init);

  if (res.status === 401) {
    handleUnauthorized();
  }

  return res;
};

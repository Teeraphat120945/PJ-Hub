export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * Get authentication header (Bearer token)
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
 * Clear session data when token expires or is invalid
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
 * Fetch wrapper that automatically handles 401 Unauthorized
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

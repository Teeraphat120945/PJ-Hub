const API = "http://localhost:3000/api/auth";

export const getProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
};

export const loginApi = async (identifier: string, password: string) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
  }

  return data;
};

export const registerApi = async (username: string, email: string, password: string) => {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "สมัครสมาชิกไม่สำเร็จ");
  }

  return data;
};

export const getOAuthUrl = async (provider: "google" | "microsoft"): Promise<{ url: string; isConfigured: boolean }> => {
  const res = await fetch(`${API}/${provider}/url`);
  const data = await res.json();
  return data;
};

export const demoSocialLoginApi = async (provider: "google" | "microsoft", email: string, name?: string) => {
  const res = await fetch(`${API}/demo-social-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, email, name }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Social login failed");
  }

  return data;
};


import { API_BASE_URL, fetchWithAuth } from "../config/api";

const API = `${API_BASE_URL}/api/auth`;

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token");
  }

  const res = await fetchWithAuth(`${API}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
};

export const loginApi = async (
  identifier: string,
  password: string
) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "เข้าสู่ระบบไม่สำเร็จ"
    );
  }

  return data;
};

export const registerApi = async (
  username: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "สมัครสมาชิกไม่สำเร็จ"
    );
  }

  return data;
};

export const getOAuthUrl = async (
  provider: "google" | "microsoft"
): Promise<{
  url: string;
  isConfigured: boolean;
  message?: string;
}> => {
  const endpoint =
    provider === "google"
      ? "/oauth/google"
      : "/microsoft/url";

  const res = await fetch(`${API}${endpoint}`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "ไม่สามารถเชื่อมต่อ OAuth ได้"
    );
  }

  return data;
};

export const demoSocialLoginApi = async (
  provider: "google" | "microsoft",
  email: string,
  name?: string
) => {
  const res = await fetch(
    `${API}/demo-social-login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        email,
        name,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Social login failed"
    );
  }

  return data;
};

/* =========================================================
   Password Reset & Change APIs
========================================================= */

export const requestPasswordResetApi = async (identifier: string) => {
  const res = await fetch(`${API}/forgot-password/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้");
  }
  return data as {
    message: string;
    resetToken: string;
    maskedEmail: string;
    username: string;
    demoOtp?: string;
  };
};

export const verifyResetOtpApi = async (resetToken: string, otp: string) => {
  const res = await fetch(`${API}/forgot-password/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resetToken, otp }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "ยืนยันรหัส OTP ไม่สำเร็จ");
  }
  return data as {
    message: string;
    verifiedToken: string;
  };
};

export const resetPasswordApi = async (verifiedToken: string, newPassword: string) => {
  const res = await fetch(`${API}/forgot-password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ verifiedToken, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ");
  }
  return data as {
    message: string;
  };
};

export const changePasswordApi = async (
  identifier: string,
  currentPassword: string,
  newPassword: string
) => {
  const res = await fetch(`${API}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      currentPassword,
      newPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
  }
  return data as {
    message: string;
  };
};

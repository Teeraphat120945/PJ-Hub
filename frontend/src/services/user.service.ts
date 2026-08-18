const API = "http://localhost:3000/api/user";

const getToken = () => localStorage.getItem("token");

const authHeader = () => {
  const token = getToken();

  if (!token) {
    throw new Error("No token found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface Role {
  role_id: number;
  role_name: string;
}

export type User = {
  user_id: string;
  user_name: string;
  role_flg: number;
  role_name: string;
  deleted_flg: 0 | 1;
};

export const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API}/getUsers`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "โหลดผู้ใช้ไม่สำเร็จ");
  }

  const data: { data: User[] } = await res.json();
  return data.data;
};

export const updateUserRole = async (
  user_id: string,
  role_flg: number,
): Promise<void> => {
  const res = await fetch(`${API}/users/${user_id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ role_flg }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "เปลี่ยนระดับสิทธิ์ไม่สำเร็จ");
  }
};

export const updateUserActive = async (
  user_id: string,
  active: 0 | 1,
): Promise<void> => {
  const res = await fetch(`${API}/users/${user_id}/active`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ active }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "เปลี่ยนสถานะไม่สำเร็จ");
  }
};

export const fetchAvailableUsers = async (classId: string) => {
  const res = await fetch(`${API}/users/${classId}/available-users`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
  }

  const data = await res.json();
  return data.data;
};

export const fetchgetRoles = async (): Promise<Role[]> => {
  const res = await fetch(`${API}/get-role`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "โหลดระดับสิทธิ์ไม่สำเร็จ");
  }

  const data = await res.json();
  return data;
};
const API = "http://localhost:3000/api/class-user";

export const authHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};
export type Class = {
  class_id: string;
  class_name: string;
};

export type ClassUser = {
  user_id: string;
  user_name: string;
  role_flg: number;
  view_flg: 0 | 1;
};

export const fetchClasses = async (): Promise<Class[]> => {
  const res = await fetch(`${API}/classes`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "โหลดรายวิชาไม่สำเร็จ");
  }

  const data = await res.json();
  return data.data;
};

export const fetchClassUsers = async (
  classId: string,
): Promise<ClassUser[]> => {
  const res = await fetch(`${API}/${classId}/users`, { headers: authHeader() });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "โหลดข้อมูลสมาชิกในวิชาไม่สำเร็จ");
  }

  const data = await res.json();
  return data.data;
};

export const addClassUser = async (classId: string, user_id: string) => {
  const res = await fetch(`${API}/${classId}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ user_id }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "เพิ่มผู้ใช้เข้าคลาสไม่สำเร็จ");
  }

  return res.json();
};

export const removeClassUser = async (classId: string, userId: string) => {
  const res = await fetch(`${API}/${classId}/users/${userId}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "ลบผู้ใช้ออกจากคลาสไม่สำเร็จ");
  }
};


const API = "http://localhost:3000/api/class";

export const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type Assignment = {
  assignment_id: number;
  assignment_name: string;
  assignment_type: string;
  created_datetime: string;
};

export type Class = {
  class_id: string;
  class_name: string;
  class_describe?: string;
};

type TeacherClassItem = {
  class_id: string;
  class_name: string;
  assignment_count: number;
};

export const createClass = async (
  classId: string,
  className: string,
  describe?: string,
): Promise<void> => {
  const res = await fetch(`${API}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ classId, className, describe }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "สร้างรายวิชาไม่สำเร็จ");
  }
};

export const fetchClasses = async (search?: string) => {
  const url = search
    ? `${API}/view?search=${encodeURIComponent(search)}`
    : `${API}/view`;

  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });

  const data = await res.json();
  return data.data;
};

export const fetchClassDetail = async (classId: string): Promise<Class> => {
  const res = await fetch(`${API}/getclass/${classId}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
  }

  const data = await res.json();
  return data.data;
};

export const updateClass = async (
  classId: string,
  className: string,
  describe?: string,
): Promise<void> => {
  const res = await fetch(`${API}/update/${classId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({
      class_name: className,
      class_describe: describe,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "แก้ไขรายวิชาไม่สำเร็จ");
  }
};

export const getClassesByUser = async (): Promise<Class[]> => {
  const res = await fetch(`${API}/getclass/by-user`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
  }

  const data: { data: Class[] } = await res.json();
  return data.data;
};

export const getTeacherClasses = async (): Promise<TeacherClassItem[]> => {
  const res = await fetch(`${API}/getclass/by-teacher`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("โหลดรายวิชาไม่สำเร็จ");
  }

  const data = await res.json();
  return data.data;
};

export const deleteClass = async (
  classId: string
): Promise<void> => {
  const res = await fetch(
    `${API}/delete/${classId}`,
    {
      method: "DELETE",
      headers: authHeader(),
    }
  );

  if (!res.ok) {
    throw new Error("ลบรายวิชาไม่สำเร็จ");
  }
};
const API = "http://localhost:3000/api/assignment";

const getToken = () => localStorage.getItem("token");

export const authHeader = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type CreateAssignmentPayload = {
  class_id: string;
  title: string;
  detail: string;
  link?: string;
  work_type: string;
  files?: File[];
};

export type AssignmentFile = {
  id: number;
  name: string;
  url: string;
};

export type Assignment = {
  class_id: string;
  assignment_id: number;
  assignment_name: string;
  assignment_type: string;
  assignment_detail: string;
  created_by: string;
  created_datetime: string;
  files: AssignmentFile[];
  assignment_link?: string;

  newFiles?: File[];
};

export type UpdateAssignmentPayload = Assignment & {
  newFiles?: File[];
  deletedFileIds?: number[];
};

export const createAssignment = async (
  payload: CreateAssignmentPayload,
): Promise<void> => {
  const formData = new FormData();

  formData.append("class_id", payload.class_id);
  formData.append("title", payload.title);
  formData.append("detail", payload.detail);
  formData.append("work_type", payload.work_type);

  if (payload.link) {
    formData.append("link", payload.link);
  }

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch(`${API}/create`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  if (!res.ok) {
    throw new Error("สร้างผลงานไม่สำเร็จ");
  }
};

export const getAssignmentByClass = async (
  classId: string,
): Promise<Assignment[]> => {
  const res = await fetch(`${API}/get-assignment/${classId}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("โหลดผลงานไม่สำเร็จ");
  }

  const data: { data: Assignment[] } = await res.json();
  return data.data;
};

export const getAssignmentDetail = async (
  assignment_id: string,
): Promise<Assignment> => {
  const res = await fetch(`${API}/get-detail/${assignment_id}`, {
    method: "GET",
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดรายละเอียดงานได้");
  }

  const json: { data: Assignment } = await res.json();
  return json.data;
};

export const downloadAssignmentFile = async (fileId: number) => {
  const res = await fetch(`${API}/assignment/file/${fileId}`, {
    method: "GET",
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("ดาวน์โหลดไฟล์ไม่สำเร็จ");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getAssignmentByUser = async () => {
  const res = await fetch(`${API}/get-assignment-by-user`, {
    method: "GET",
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("โหลดผลงานไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data;
};

export const updateAssignment = async (
  assignmentId: number,
  payload: UpdateAssignmentPayload,
): Promise<void> => {
  const formData = new FormData();

  formData.append("title", payload.assignment_name);
  formData.append("detail", payload.assignment_detail);
  formData.append("work_type", payload.assignment_type);
  formData.append("class_id", payload.class_id.toString());
  if (payload.assignment_link) {
    formData.append("link", payload.assignment_link);
  }

  payload.newFiles?.forEach((file) => {
    formData.append("files", file);
  });

  payload.deletedFileIds?.forEach((id) => {
    formData.append("deletedFileIds[]", id.toString());
  });

  const res = await fetch(`${API}/update/${assignmentId}`, {
    method: "PUT",
    headers: authHeader(),
    body: formData,
  });

  if (!res.ok) {
    throw new Error("แก้ไขผลงานไม่สำเร็จ");
  }
};

export const deleteAssignment = async (assignmentId: number) => {
  const res = await fetch(`${API}/delete/${assignmentId}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("ลบผลงานไม่สำเร็จ");
  }
};

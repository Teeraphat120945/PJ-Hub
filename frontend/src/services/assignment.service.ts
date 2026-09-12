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
  class_created_by?: string;
  assignment_id: number;
  assignment_name: string;
  assignment_type: string;
  assignment_detail: string;
  created_by: string;
  created_datetime: string;
  files: AssignmentFile[];
  assignment_link?: string;
  view_cnt: number;
  newFiles?: File[];
  is_work_owner?: boolean;
  is_class_responsible?: boolean;
  can_comment?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_access_resources?: boolean;
  retention_days?: number;
  expires_at?: string;
  days_remaining?: number;
  is_expired?: boolean;
  is_expiring_soon?: boolean;
  file_count?: number;
  has_files?: boolean;
  has_link?: boolean;
  has_no_resources?: boolean;
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "สร้างผลงานไม่สำเร็จ");
  }
};

export const getAssignmentByClass = async (
  classId: string,
): Promise<Assignment[]> => {
  const res = await fetch(`${API}/get-assignment/${classId}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "โหลดผลงานไม่สำเร็จ");
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "ไม่สามารถโหลดรายละเอียดผลงานได้");
  }

  const json: { data: Assignment } = await res.json();
  return json.data;
};

export const downloadAssignmentFile = async (fileId: number, fileName?: string) => {
  const res = await fetch(`${API}/file/${fileId}`, {
    method: "GET",
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "ดาวน์โหลดไฟล์ไม่สำเร็จ");
  }

  let name = fileName || "download";
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const rfc5987Match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;\n]+)/i);
    if (rfc5987Match && rfc5987Match[1]) {
      name = decodeURIComponent(rfc5987Match[1].replace(/['"]/g, "").trim());
    } else {
      const regularMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (regularMatch && regularMatch[1]) {
        name = decodeURIComponent(regularMatch[1].replace(/['"]/g, "").trim());
      }
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getAssignmentByUser = async (onlyMe?: boolean) => {
  const query = onlyMe ? "?only_me=true" : "";
  const res = await fetch(`${API}/get-assignment-by-user${query}`, {
    method: "GET",
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "โหลดผลงานไม่สำเร็จ");
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "แก้ไขผลงานไม่สำเร็จ");
  }
};

export const deleteAssignment = async (assignmentId: number) => {
  const res = await fetch(`${API}/delete/${assignmentId}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "ลบผลงานไม่สำเร็จ");
  }
};

export type SearchAssignmentResult = {
  assignment_id: number;
  assignment_name: string;
  assignment_type: string;
  assignment_detail?: string;
  created_datetime: string;
  view_cnt: number;
  class_id: string;
  class_name: string;
};

export const searchAssignments = async (query: string): Promise<SearchAssignmentResult[]> => {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API}/search?search=${encodeURIComponent(query.trim())}`, {
      headers: authHeader(),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({ data: [] }));
    return json.data || [];
  } catch (e) {
    console.error("searchAssignments error:", e);
    return [];
  }
};

export type LinkCheckResult = {
  is_healthy: boolean;
  status_code: number | null;
  reason: "healthy" | "restricted" | "not_found" | "timeout" | "network_error" | "invalid_url" | "invalid_domain" | "error_status";
  message: string;
  tested_url?: string;
};

export const checkLinkService = async (url: string): Promise<LinkCheckResult> => {
  const res = await fetch(`${API}/check-link`, {
    method: "POST",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "ตรวจสอบลิงก์ไม่สำเร็จ");
  }

  return await res.json();
};
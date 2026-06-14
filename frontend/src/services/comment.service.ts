const API = "http://localhost:3000/api/comments";

const getToken = () => localStorage.getItem("token");

export const authHeader = (): HeadersInit => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export type Comment = {
  comment_id: number;
  assignment_id: number;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_datetime: string;
};

export const addCommentService = async (
  assignment_id: string | number,
  message: string,
): Promise<Comment | null> => {
  if (!message.trim() || !assignment_id) {
    return null;
  }

  const payload = {
  assignment_id: Number(assignment_id),
  user_id: localStorage.getItem("user_id"),
  comment_text: message,
  };

  const res = await fetch(
    `${API}/create`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(
      "สร้าง comment ไม่สำเร็จ"
    );
  }

  const data = await res.json();

  return data;
};

export const getCommentsService = async (
  assignment_id: string | number,
): Promise<Comment[]> => {
  const res = await fetch(`${API}/${assignment_id}`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });

  if (!res.ok) {
    throw new Error("โหลด comment ไม่สำเร็จ");
  }

  const data = await res.json();

  return data;
};

export const updateCommentService = async (
  comment_id: number,
  comment_text: string,
) => {
  const res = await fetch(`${API}/update/${comment_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({
      comment_text,
    }),
  });

  if (!res.ok) {
    throw new Error("แก้ไข comment ไม่สำเร็จ");
  }

  return await res.json();
};

export const deleteCommentService = async (comment_id: number) => {
  const res = await fetch(`${API}/delete/${comment_id}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("ลบ comment ไม่สำเร็จ");
  }

  return await res.json();
};
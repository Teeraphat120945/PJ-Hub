import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";

import {
  getAssignmentDetail,
  downloadAssignmentFile,
  type Assignment,
} from "../../services/assignment.service";

import {
  addCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
  type Comment,
} from "../../services/comment.service";

import "../../css/assignments/AssignmentDetail.css";

const AssignmentDetail = () => {
  const { assignment_id } = useParams<{
    assignment_id: string;
  }>();

  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);

  const [newComment, setNewComment] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editText, setEditText] = useState("");

  const token = localStorage.getItem("token");

  const currentUserId = localStorage.getItem("user_id");

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!assignment_id) return;

    fetchData();
    fetchComments();
  }, [assignment_id]);

  const fetchData = async () => {
    try {
      const res = await getAssignmentDetail(assignment_id!);

      setAssignment({
        ...res,
        files: Array.isArray(res.files) ? res.files : [],
      });
    } catch (error) {
      console.error("โหลดข้อมูลผลงานไม่สำเร็จ", error);

      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsService(assignment_id!);

      setComments(data);
    } catch (error) {
      console.error("โหลด comment ไม่สำเร็จ", error);
    }
  };

  const handleAddComment = async () => {
    try {
      const newItem = await addCommentService(assignment_id!, newComment);

      if (!newItem) return;

      setComments((prev) => [newItem, ...prev]);

      setNewComment("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (comment_id: number) => {
    try {
      await deleteCommentService(comment_id);

      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEdit = async (comment_id: number) => {
    try {
      await updateCommentService(comment_id, editText);

      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === comment_id
            ? {
                ...c,
                comment_text: editText,
              }
            : c,
        ),
      );

      setEditingId(null);

      setEditText("");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="create-assignment-page">
        <div className="create-assignment-card">
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-required">
        <div className="login-required-card">
          <h2>เข้าสู่ระบบเพื่อดูผลงานเพิ่มเติม</h2>

          <button onClick={() => navigate("/login")}>ไปหน้าเข้าสู่ระบบ</button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="create-assignment-page">
        <div className="create-assignment-card">
          <p>ไม่พบข้อมูลผลงาน</p>

          <button onClick={() => navigate(-1)}>← กลับ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-detail-layout">
      {/* LEFT */}
      <div className="create-assignment-card">
        <div className="page-header">
          <button className="back-inline-btn" onClick={() => navigate(-1)}>
            ← กลับ
          </button>

          <h2 className="page-title">ผลงาน : {assignment.assignment_name}</h2>

          <div className="header-spacer" />
        </div>

        <div className="form-grid">
          <div className="field grid-6">
            <label>รายวิชา</label>

            <div className="readonly-box">{assignment.class_id}</div>
          </div>

          <div className="field grid-6">
            <label>ชื่อผลงาน</label>

            <div className="readonly-box">{assignment.assignment_name}</div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">ประเภทผลงาน</label>

            <div className="tag-grid readonly">
              {[
                "Web",
                "Application",
                "Web Application",
                "IOT",
                "Document",
                "Other",
              ].map((tag) => (
                <label key={tag} className="tag-item">
                  <span
                    className={
                      assignment.assignment_type === tag ? "active" : ""
                    }
                  >
                    {tag}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">รายละเอียด</label>

            <div className="readonly-box multiline">
              {assignment.assignment_detail || "-"}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">แนบผลงาน</label>

            <div className="form-grid">
              <div className="field grid-6">
                <label>แนบไฟล์</label>

                {assignment.files.length > 0 ? (
                  <ul className="file-list">
                    {assignment.files.map((file) => (
                      <li key={file.id} className="file-item">
                        <button
                          type="button"
                          className="file-link"
                          onClick={() => downloadAssignmentFile(file.id!)}
                        >
                          {file.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="readonly-box">ไม่มีไฟล์</div>
                )}
              </div>

              <div className="field grid-6">
                <label>แนบลิงก์</label>

                {assignment.assignment_link ? (
                  <a
                    href={assignment.assignment_link}
                    target="_blank"
                    rel="noreferrer"
                    className="assignment-link"
                  >
                    {assignment.assignment_link}
                  </a>
                ) : (
                  <div className="readonly-box">ไม่มีลิงก์</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMENT */}
      <div className="comment-panel">
        <h3>ความคิดเห็น</h3>

        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="no-comment">ยังไม่มีความคิดเห็น</p>
          ) : (
            comments.map((c) => (
              <div key={c.comment_id} className="comment-item">
                <div className="comment-top">
                  <div className="comment-header">
                    <div className="comment-user-avatar">
                      {c.user_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="comment-user-info">
                      <span className="comment-user">{c.user_name}</span>

                      <span className="comment-time">
                        {new Date(c.created_datetime).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {(role === "0" ||
                    String(c.user_id) === String(currentUserId)) && (
                    <div className="comment-menu">
                      <button className="gear-btn">
                        <FiSettings />
                      </button>

                      <div className="menu-dropdown">
                        <button
                          onClick={() => {
                            setEditingId(c.comment_id);
                            setEditText(c.comment_text);
                          }}
                        >
                          แก้ไข
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteComment(c.comment_id)}
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="comment-message">
                  {editingId === c.comment_id ? (
                    <>
                      <textarea
                        className="comment-edit-box"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />

                      <div className="comment-edit-action">
                        <button
                          className="save-edit-btn"
                          onClick={() => handleSaveEdit(c.comment_id)}
                        >
                          บันทึก
                        </button>
                      </div>
                    </>
                  ) : (
                    c.comment_text
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="comment-input">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={150}
            placeholder="พิมพ์ความคิดเห็น..."
          />
          <div className="char-count">
            {newComment.length}/150
          </div>
          <button onClick={handleAddComment} disabled={!newComment.trim()}>บันทึก</button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;

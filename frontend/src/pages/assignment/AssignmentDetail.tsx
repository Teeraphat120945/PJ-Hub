import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiTag,
  FiDownload,
  FiExternalLink,
  FiMessageSquare,
  FiMoreVertical,
  FiSend,
  FiFile,
  FiLogIn,
  FiEdit,
  FiTrash2,
  FiX,
  FiCheck,
  FiLock,
} from "react-icons/fi";
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
import { toast } from "react-toastify";

const AssignmentDetail = () => {
  const { assignment_id } = useParams<{ assignment_id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const userRole = role !== null && role !== undefined ? Number(role) : null;

  const isWorkOwner = Boolean(
    assignment && currentUserId && String(assignment.created_by) === String(currentUserId)
  );

  const isCourseInstructor = Boolean(
    userRole === 0 ||
    userRole === 1 ||
    (assignment && currentUserId && String(assignment.class_created_by) === String(currentUserId))
  );

  const canComment = isWorkOwner || isCourseInstructor;
  const isStudentOrStaff = userRole === 0 || userRole === 1 || userRole === 2;
  const canAccessResources = isStudentOrStaff && (assignment ? (assignment as any).can_access_resources !== false : true);

  useEffect(() => {
    if (!assignment_id) return;

    if (!token) {
      setLoading(false);
      return;
    }

    fetchData();
    fetchComments();
  }, [assignment_id, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
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
    if (!newComment.trim()) return;

    try {
      setSendingComment(true);
      const newItem = await addCommentService(assignment_id!, newComment.trim());

      if (!newItem) return;

      setComments((prev) => [newItem, ...prev]);
      setNewComment("");
      toast.success("ส่งความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("ส่งความคิดเห็นไม่สำเร็จ");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (comment_id: number) => {
    if (!window.confirm("คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?")) return;

    try {
      await deleteCommentService(comment_id);
      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
      toast.success("ลบความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("ลบความคิดเห็นไม่สำเร็จ");
    }
  };

  const handleSaveEdit = async (comment_id: number) => {
    if (!editText.trim()) return;

    try {
      await updateCommentService(comment_id, editText.trim());

      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === comment_id
            ? { ...c, comment_text: editText.trim() }
            : c,
        ),
      );

      setEditingId(null);
      setEditText("");
      toast.success("แก้ไขความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("แก้ไขความคิดเห็นไม่สำเร็จ");
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="spinner" />
        <p>กำลังโหลดข้อมูลผลงาน...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-required">
        <div className="login-required-card">
          <div className="auth-logo-badge">UP</div>
          <h2>เข้าสู่ระบบเพื่อดูผลงาน</h2>
          <p>กรุณาเข้าสู่ระบบด้วยบัญชีของคุณเพื่อดูรายละเอียดผลงานและร่วมแสดงความคิดเห็น</p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            <FiLogIn /> ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="detail-loading-wrapper">
        <h3>ไม่พบข้อมูลผลงาน</h3>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft /> ย้อนกลับ
        </button>
      </div>
    );
  }

  return (
    <div className="assignment-detail-layout">
      <div className="assignment-detail-card">
        <div className="detail-page-header">
          <button className="back-inline-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> ย้อนกลับ
          </button>

          <div className="detail-header-title-box">
            <h2 className="detail-page-title">{assignment.assignment_name}</h2>
          </div>
        </div>

        <div className="form-grid margin-top-20">
          <div className="field grid-6">
            <label className="field-label">
              <FiBookOpen size={15} /> รหัสรายวิชา
            </label>
            <div className="readonly-box code-box">{assignment.class_id}</div>
          </div>

          <div className="field grid-6">
            <label className="field-label">
              <FiTag size={15} /> ประเภทผลงาน
            </label>
            <div className="readonly-box font-weight-600">
              <span className="type-badge-pill">
                {assignment.assignment_type || "General"}
              </span>
            </div>
          </div>
        </div>

        <div className="field margin-top-16">
          <label className="field-label">รายละเอียดผลงาน</label>
          <div className="readonly-box multiline">
            {assignment.assignment_detail || "ไม่มีรายละเอียดเพิ่มเติม"}
          </div>
        </div>

        <div className="field margin-top-16">
          <label className="field-label">ไฟล์ประกอบและลิงก์</label>
          <div className="form-grid">
            <div className="field grid-6">
              <label className="sub-field-label">ไฟล์แนบ</label>
              {!canAccessResources ? (
                <div className="resource-locked-box">
                  <div className="locked-icon-box">
                    <FiLock size={16} />
                  </div>
                  <div className="locked-text-content">
                    <span className="locked-title">การดาวน์โหลดไฟล์ถูกจำกัดสิทธิ์</span>
                    <span className="locked-desc">
                      สงวนสิทธิ์การดาวน์โหลดเฉพาะนิสิตในรายวิชาเท่านั้น (กรุณาให้อาจารย์ประจำวิชาปรับระดับเป็นนิสิต)
                    </span>
                  </div>
                </div>
              ) : assignment.files.length > 0 ? (
                <ul className="file-list">
                  {assignment.files.map((file) => (
                    <li key={file.id} className="file-item">
                      <FiFile size={16} className="file-icon" />
                      <button
                        type="button"
                        className="file-link"
                        onClick={() => downloadAssignmentFile(file.id!, file.name)}
                        title="คลิกเพื่อดาวน์โหลดไฟล์"
                      >
                        {file.name}
                      </button>
                      <FiDownload size={14} className="download-icon" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="readonly-box empty-box">ไม่มีไฟล์แนบ</div>
              )}
            </div>

            <div className="field grid-6">
              <label className="sub-field-label">ลิงก์ผลงานภายนอก</label>
              {!canAccessResources ? (
                <div className="resource-locked-box">
                  <div className="locked-icon-box">
                    <FiLock size={16} />
                  </div>
                  <div className="locked-text-content">
                    <span className="locked-title">การเข้าถึงลิงก์ถูกจำกัดสิทธิ์</span>
                    <span className="locked-desc">
                      สงวนสิทธิ์การดูลิงก์ผลงานเฉพาะนิสิตและอาจารย์ในรายวิชาเท่านั้น
                    </span>
                  </div>
                </div>
              ) : assignment.assignment_link ? (
                <a
                  href={
                    assignment.assignment_link.startsWith("http://") ||
                    assignment.assignment_link.startsWith("https://")
                      ? assignment.assignment_link
                      : `https://${assignment.assignment_link}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="assignment-link-btn"
                >
                  <FiExternalLink size={16} /> เปิดลิงก์ผลงาน
                </a>
              ) : (
                <div className="readonly-box empty-box">ไม่มีลิงก์ภายนอก</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="comment-panel">
        <div className="comment-panel-header">
          <FiMessageSquare size={20} className="comment-icon-head" />
          <h3>ความคิดเห็น ({comments.length})</h3>
        </div>

        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="no-comment-box">
              <FiMessageSquare size={36} className="no-comment-icon" />
              <p>ยังไม่มีความคิดเห็น</p>
              <span>เป็นคนแรกที่แสดงความคิดเห็นเกี่ยวกับผลงานนี้</span>
            </div>
          ) : (
            comments.map((c) => {
              const isCommentAuthor = String(c.user_id) === String(currentUserId);
              const canEdit = isCommentAuthor || Number(role) === 0;
              const canDelete = isCommentAuthor || isCourseInstructor || Number(role) === 0;
              const hasMenu = canEdit || canDelete;

              return (
                <div key={c.comment_id} className="comment-item">
                  <div className="comment-top">
                    <div className="comment-header">
                      <div className="comment-user-avatar">
                        {c.user_name ? c.user_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="comment-user-info">
                        <span className="comment-user">{c.user_name}</span>
                        <span className="comment-time">
                          {new Date(c.created_datetime).toLocaleString("th-TH")}
                        </span>
                      </div>
                    </div>

                    {hasMenu && (
                      <div className="comment-menu">
                        <button className="gear-btn" title="ตัวเลือก">
                          <FiMoreVertical size={16} />
                        </button>
                        <div className="menu-dropdown">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingId(c.comment_id);
                                setEditText(c.comment_text);
                              }}
                            >
                              <FiEdit size={13} /> แก้ไข
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteComment(c.comment_id)}
                            >
                              <FiTrash2 size={13} /> ลบ
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="comment-message">
                    {editingId === c.comment_id ? (
                      <div className="edit-comment-wrapper">
                        <textarea
                          className="comment-edit-box"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="comment-edit-action">
                          <button
                            className="btn-cancel-edit"
                            onClick={() => setEditingId(null)}
                          >
                            <FiX size={14} /> ยกเลิก
                          </button>
                          <button
                            className="save-edit-btn"
                            onClick={() => handleSaveEdit(c.comment_id)}
                          >
                            <FiCheck size={14} /> บันทึก
                          </button>
                        </div>
                      </div>
                    ) : (
                      c.comment_text
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canComment ? (
          <div className="comment-input-area">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={150}
              placeholder={
                isCourseInstructor && !isWorkOwner
                  ? "พิมพ์ข้อเสนอแนะหรือความคิดเห็นจากผู้สอน..."
                  : "พิมพ์ความคิดเห็นหรือตอบกลับที่นี่..."
              }
            />
            <div className="comment-input-footer">
              <span className="char-count">{newComment.length} / 150 ตัวอักษร</span>
              <button
                className="btn-send-comment"
                onClick={handleAddComment}
                disabled={sendingComment || !newComment.trim()}
              >
                <FiSend size={15} /> {sendingComment ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-restricted-notice">
            <div className="notice-icon-box">
              <FiLock size={18} />
            </div>
            <div className="notice-content">
              <p className="notice-title">การสนทนาเฉพาะผู้สอนและเจ้าของผลงาน</p>
              <p className="notice-desc">
                คุณสามารถอ่านความคิดเห็นและข้อเสนอแนะได้ แต่การส่งและตอบกลับความคิดเห็นสงวนสิทธิ์เฉพาะอาจารย์ผู้สอนประจำวิชาและเจ้าของผลงานเท่านั้น
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;
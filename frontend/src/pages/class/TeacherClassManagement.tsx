import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiFolder,
  FiPlusSquare,
  FiCalendar,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { getTeacherClasses, deleteClass, type TeacherClassItem } from "../../services/class.service";
import { formatThaiYear } from "../../utils/dateUtils";
import "../../css/classes/TeacherClassManagement.css";
import { toast } from "react-toastify";

function TeacherClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const role = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const isAdmin = role !== null && Number(role) === 0;
  const currentUserId = localStorage.getItem("user_id") || localStorage.getItem("userId");

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        const data = await getTeacherClasses();
        setClasses(data);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "โหลดรายวิชาที่ดูแลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(classId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteClass(confirmDeleteId);
      setClasses((prev) => prev.filter((c) => c.class_id !== confirmDeleteId));
      toast.success("ลบรายวิชาสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "ลบรายวิชาไม่สำเร็จ");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="teacher-classes-loading">
          <p>กำลังโหลดรายวิชาที่ดูแล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="teacher-classes-header">
        <div className="title-group">
          <div className="title-icon-box">
            <FiBookOpen size={24} />
          </div>
          <div>
            <h2 className="page-title">{isAdmin ? "รายวิชาทั้งหมดในระบบ (ดูแลระบบ)" : "รายวิชาที่ดูแล"}</h2>
            <p className="page-subtitle">
              {isAdmin
                ? `รายวิชาทั้งหมดในระบบที่คุณมีสิทธิ์กำกับดูแลและจัดการ (${classes.length} วิชา)`
                : `รายวิชาที่คุณรับผิดชอบและมีสิทธิ์จัดการผลงานทั้งหมด (${classes.length} วิชา)`}
            </p>
          </div>
        </div>

        <button
          className="btn-create-course"
          onClick={() => navigate("/CreateClass")}
        >
          <FiPlusSquare size={18} /> เพิ่มรายวิชาใหม่
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty-classes-card">
          <FiBookOpen size={48} className="empty-icon" />
          <h3>{isAdmin ? "ยังไม่มีรายวิชาในระบบ" : "ยังไม่มีรายวิชาที่ดูแล"}</h3>
          <p>
            {isAdmin
              ? "ยังไม่พบรายวิชาที่ถูกบันทึกไว้ในระบบ คุณสามารถสร้างรายวิชาใหม่เพื่อเริ่มต้นเปิดรับผลงานได้"
              : "คุณสามารถสร้างรายวิชาใหม่เพื่อเริ่มต้นเปิดรับผลงานได้"}
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("/CreateClass")}
          >
            <FiPlusSquare /> สร้างรายวิชาแรก
          </button>
        </div>
      ) : (
        <div className="teacher-class-grid">
          {classes.map((c) => (
            <div
              key={c.class_id}
              className="teacher-class-card"
              onClick={() => navigate(`/class/${c.class_id}`)}
            >
              <div className="card-top-line" />

              <div className="card-content-top">
                <div className="teacher-class-badges">
                  <span className="class-code-chip">
                    <FiBookOpen size={14} />
                    {c.class_id}
                  </span>

                  {c.created_datetime && (
                    <span
                      className="class-year-chip"
                      title={`ปี พ.ศ. ที่เปิดรายวิชา: ${formatThaiYear(c.created_datetime)}`}
                    >
                      <FiCalendar size={13} />
                      {formatThaiYear(c.created_datetime)}
                    </span>
                  )}
                </div>

                <div className="card-top-right">
                  <span className="assignment-count-chip">
                    <FiFolder size={14} /> {c.assignment_count} ผลงาน
                  </span>
                </div>
              </div>

              <h3 className="class-name-heading">{c.class_name}</h3>

              <div
                className="teacher-class-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="btn-action view"
                  onClick={() => navigate(`/class/${c.class_id}`)}
                  title="ดูรายละเอียดรายวิชา"
                >
                  <FiEye size={15} /> ดูรายวิชา
                </button>

                {(isAdmin || (currentUserId && String(c.created_by) === String(currentUserId))) && (
                  <>
                    <button
                      type="button"
                      className="btn-action edit"
                      onClick={() => navigate(`/class/${c.class_id}/edit`)}
                      title="แก้ไขรายวิชา"
                    >
                      <FiEdit2 size={15} /> แก้ไข
                    </button>

                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={(e) => handleDeleteClick(e, c.class_id)}
                      title="ลบรายวิชา"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="delete-modal-overlay" onClick={() => !deleting && setConfirmDeleteId(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <FiAlertTriangle size={32} />
            </div>
            <h3 className="delete-modal-title">ยืนยันการลบรายวิชา</h3>
            <p className="delete-modal-desc">
              คุณต้องการลบรายวิชา{" "}
              <strong>
                {(() => {
                  const target = classes.find((c) => c.class_id === confirmDeleteId);
                  return target ? `${target.class_id} - ${target.class_name}` : confirmDeleteId;
                })()}
              </strong>{" "}
              ใช่หรือไม่?<br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                ยกเลิก
              </button>
              <button
                className="btn-modal-confirm"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "กำลังลบ..." : "ลบรายวิชา"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherClassManagement;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiFolder, FiArrowRight, FiPlusSquare, FiCalendar } from "react-icons/fi";
import { getTeacherClasses, type TeacherClassItem } from "../../services/class.service";
import { formatThaiYear } from "../../utils/dateUtils";
import "../../css/classes/TeacherClassManagement.css";
import { toast } from "react-toastify";

function TeacherClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const isAdmin = Number(role) === 0;

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

                <span className="assignment-count-chip">
                  <FiFolder size={14} /> {c.assignment_count} ผลงาน
                </span>
              </div>

              <h3 className="class-name-heading">{c.class_name}</h3>

              <div className="card-footer-action">
                <span className="action-link-text">
                  จัดการผลงานในรายวิชา <FiArrowRight className="arrow-icon" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherClassManagement;


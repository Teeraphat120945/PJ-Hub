import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiFolder, FiArrowRight, FiPlusSquare } from "react-icons/fi";
import { getTeacherClasses } from "../../services/class.service";
import "../../css/classes/TeacherClassManagement.css";

type TeacherClassItem = {
  class_id: string;
  class_name: string;
  assignment_count: number;
};

function TeacherClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        const data = await getTeacherClasses();
        setClasses(data);
      } catch (err) {
        console.error(err);
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
            <h2 className="page-title">รายวิชาที่ดูแล</h2>
            <p className="page-subtitle">
              รายวิชาที่คุณรับผิดชอบและมีสิทธิ์จัดการผลงานทั้งหมด {classes.length} วิชา
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
          <h3>ยังไม่มีรายวิชาที่ดูแล</h3>
          <p>คุณสามารถสร้างรายวิชาใหม่เพื่อเริ่มต้นเปิดรับผลงานได้</p>
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
                <span className="class-code-chip">
                  <FiBookOpen size={14} />
                  {c.class_id}
                </span>

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


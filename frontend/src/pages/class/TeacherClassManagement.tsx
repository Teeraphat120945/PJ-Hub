import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await getTeacherClasses();
        setClasses(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadClasses();
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-title">รายวิชาที่ดูแล</h2>

      {classes.length === 0 ? (
        <p className="empty-text">ยังไม่มีรายวิชาที่ดูแล</p>
      ) : (
        <div className="assignment-list">
          {classes.map((c) => (
            <div
              key={c.class_id}
              className="assignment-item"
              onClick={() => navigate(`/class/${c.class_id}`)}
            >
              <div className="assignment-info">
                <div className="assignment-class">
                  {c.class_id} : {c.class_name}
                </div>

                <div className="assignment-name">
                  จำนวนผลงานทั้งหมด {c.assignment_count} ชิ้น
                </div>
              </div>

              <div
                className="assignment-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn view"
                  onClick={() => navigate(`/class/${c.class_id}`)}
                >
                  จัดการผลงานในรายวิชา →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherClassManagement;

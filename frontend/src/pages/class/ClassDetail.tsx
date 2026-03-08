import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchClassDetail, type Class } from "../../services/class.service";
import {
  getAssignmentByClass,
  deleteAssignment,
} from "../../services/assignment.service";
import "../../css/classes/ClassDetail.css";
import { toast } from "react-toastify";

type AssignmentCard = {
  assignment_id: number;
  assignment_name: string;
  assignment_type: string;
  created_datetime: string;
  created_by: string;
};

const ITEMS_PER_PAGE = 9;

const ClassDetail = () => {
  const { class_id } = useParams<{ class_id: string }>();
  const navigate = useNavigate();

  const [classDetail, setClassDetail] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<AssignmentCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const currentUserId = localStorage.getItem("user_id");
  const currentRole = Number(localStorage.getItem("role"));

  useEffect(() => {
    if (!class_id) return;

    const loadData = async () => {
      try {
        const classData = await fetchClassDetail(class_id);
        setClassDetail(classData);

        const assignmentData = await getAssignmentByClass(class_id);
        setAssignments(assignmentData);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [class_id]);

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm("ต้องการลบผลงานนี้หรือไม่?")) return;

    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.assignment_id !== id));
      toast.success("ลบผลงานเรียบร้อย");
    } catch {
      toast.error("ลบผลงานไม่สำเร็จ");
    }
  };

  if (!classDetail) {
    return <div className="class-detail-container">ไม่พบรายวิชา</div>;
  }

  const totalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAssignments = assignments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  
  return (
    <div className="class-detail-container">
      <div className="class-card">
        <div className="class-card-header">
          <h2>
            {classDetail.class_id} : {classDetail.class_name}
          </h2>

          {(currentRole === 0 || currentRole === 1) && (
            <button
              className="edit-btn"
              onClick={() => navigate(`/class/${class_id}/edit`)}
            >
              แก้ไข
            </button>
          )}
        </div>

        <div className="class-card-body">
          <span className="class-description-label">รายละเอียด :</span>
          <p className="class-description">
            {classDetail.class_describe || "-"}
          </p>
        </div>
      </div>

      <div className="assignment-section">
        <h3>ผลงาน / Assignment</h3>

        {currentAssignments.length === 0 ? (
          <p className="empty-text">ยังไม่มีผลงาน</p>
        ) : (
          <div className="assignment-grid">
            {currentAssignments.map((a) => {
              const canDeleteAssignment =
                currentRole === 0 ||
                currentRole === 1 ||
                (currentRole === 2 &&
                  currentUserId === a.created_by);
              return (
                <div
                  key={a.assignment_id}
                  className="assignment-card"
                  onClick={() =>
                    navigate(`/assignment/${a.assignment_id}`)
                  }
                >
                  <div className="assignment-card-header">
                    <h4 className="assignment-title">
                      {a.assignment_name}
                    </h4>

                    {canDeleteAssignment && (
                      <button
                        className="delete-assignment-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(a.assignment_id);
                        }}
                      >
                        ลบ
                      </button>
                    )}
                  </div>

                  <div className="assignment-meta">
                    <span className="assignment-type">
                      {a.assignment_type}
                    </span>
                    <span className="assignment-date">
                      แก้ไขล่าสุด :{" "}
                      {new Date(
                        a.created_datetime,
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="assignment-footer">
                    <span className="view-detail">
                      View detail →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="home-pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassDetail;

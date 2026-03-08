import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssignmentByUser,
  deleteAssignment,
} from "../../services/assignment.service";
import "../../css/assignments/AssignmentManagement.css";
import { toast } from "react-toastify";

type AssignmentItem = {
  assignment_id: number;
  class_id: string;
  class_name: string;
  assignment_name: string;
};

function AssignmentManagement() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await getAssignmentByUser();
        setAssignments(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadAssignments();
  }, []);

  const handleDelete = async (assignmentId: number) => {
    const ok = window.confirm("คุณต้องการลบผลงานนี้ใช่หรือไม่?");
    if (!ok) return;

    try {
      await deleteAssignment(assignmentId);
      setAssignments((prev) =>
        prev.filter((a) => a.assignment_id !== assignmentId),
      );
      toast.success("ลบผลงานสำเร็จ");
    } catch (err) {
      console.error(err);
      toast.warning("ลบผลงานไม่สำเร็จ");
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">ผลงานของฉัน</h2>

      {assignments.length === 0 ? (
        <p className="empty-text">ยังไม่มีผลงาน</p>
      ) : (
        <div className="assignment-list">
          {assignments.map((a) => (
            <div
              key={a.assignment_id}
              className="assignment-item"
              onClick={() => navigate(`/assignment/${a.assignment_id}`)}
            >
              <div className="assignment-info">
                <div className="assignment-class">รายวิชา : {a.class_id}</div>

                <div className="assignment-name" title={a.assignment_name}>
                  {a.assignment_name}
                </div>
              </div>

              <div
                className="assignment-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn view"
                  onClick={() => navigate(`/assignment/${a.assignment_id}`)}
                >
                  View detail →
                </button>

                <button
                  className="action-btn edit"
                  onClick={() =>
                    navigate(`/edit-assignment/${a.assignment_id}/edit`)
                  }
                >
                  ✏️ Edit
                </button>

                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(a.assignment_id)}
                  title="ลบผลงาน"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignmentManagement;

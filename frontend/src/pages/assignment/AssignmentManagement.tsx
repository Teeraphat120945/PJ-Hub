import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFolder,
  FiPlusSquare,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
} from "react-icons/fi";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const data = await getAssignmentByUser();
        setAssignments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="assignment-management-loading">
          <p>กำลังโหลดผลงานของคุณ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="assignment-management-header">
        <div className="title-group">
          <div className="title-icon-box">
            <FiFolder size={24} />
          </div>
          <div>
            <h2 className="page-title">ผลงานของฉัน</h2>
            <p className="page-subtitle">
              จัดการและตรวจสอบผลงานทั้งหมดที่คุณได้สร้างขึ้น ({assignments.length} ชิ้น)
            </p>
          </div>
        </div>

        <button
          className="btn-create-assignment"
          onClick={() => navigate("/create-assignment")}
        >
          <FiPlusSquare size={18} /> เพิ่มผลงานใหม่
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-assignment-card">
          <FiFolder size={48} className="empty-icon" />
          <h3>ยังไม่มีผลงานที่สร้าง</h3>
          <p>คุณสามารถสร้างผลงานใหม่เพื่อจัดเก็บในคลังการเรียนรู้ได้</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/create-assignment")}
          >
            <FiPlusSquare /> สร้างผลงานแรก
          </button>
        </div>
      ) : (
        <div className="my-assignment-grid">
          {assignments.map((a) => (
            <div
              key={a.assignment_id}
              className="my-assignment-card"
              onClick={() => navigate(`/assignment/${a.assignment_id}`)}
            >
              <div className="card-top-line" />

              <div className="my-assignment-top">
                <span className="class-badge">
                  <FiBookOpen size={13} /> {a.class_id}
                </span>
              </div>

              <h3 className="my-assignment-title" title={a.assignment_name}>
                {a.assignment_name}
              </h3>

              <div
                className="my-assignment-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-action view"
                  onClick={() => navigate(`/assignment/${a.assignment_id}`)}
                  title="ดูรายละเอียดผลงาน"
                >
                  <FiEye size={15} /> ดูผลงาน
                </button>

                <button
                  className="btn-action edit"
                  onClick={() =>
                    navigate(`/edit-assignment/${a.assignment_id}/edit`)
                  }
                  title="แก้ไขผลงาน"
                >
                  <FiEdit2 size={15} /> แก้ไข
                </button>

                <button
                  className="btn-action delete"
                  onClick={() => handleDelete(a.assignment_id)}
                  title="ลบผลงาน"
                >
                  <FiTrash2 size={15} />
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


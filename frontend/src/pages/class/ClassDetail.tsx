import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiEye,
  FiArrowRight,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
} from "react-icons/fi";
import { fetchClassDetail, formatViewCount, type Class } from "../../services/class.service";
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
  view_cnt: number;
};

const ITEMS_PER_PAGE = 8;

const ClassDetail = () => {
  const { class_id } = useParams<{ class_id: string }>();
  const navigate = useNavigate();

  const [classDetail, setClassDetail] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<AssignmentCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentUserId = localStorage.getItem("user_id");
  const currentRole = Number(localStorage.getItem("role") || localStorage.getItem("role_flg"));

  useEffect(() => {
    if (!class_id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const classData = await fetchClassDetail(class_id);
        setClassDetail(classData);

        const assignmentData = await getAssignmentByClass(class_id);
        setAssignments(assignmentData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="class-detail-container">
        <div className="detail-loading-box">
          <p>กำลังโหลดข้อมูลรายวิชา...</p>
        </div>
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="class-detail-container">
        <div className="empty-classes-box">
          <h3>ไม่พบข้อมูลรายวิชา</h3>
          <button className="btn-primary" onClick={() => navigate("/")}>
            <FiArrowLeft /> กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAssignments = assignments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="class-detail-container">
      <div className="class-detail-nav">
        <button className="back-inline-btn" onClick={() => navigate("/")}>
          <FiArrowLeft /> กลับสู่หน้าหลัก
        </button>
      </div>

      <div className="class-card">
        <div className="class-card-top-accent" />
        <div className="class-card-header">
          <div className="class-header-title-group">
            <span className="class-id-badge">
              <FiBookOpen size={16} />
              {classDetail.class_id}
            </span>
            <h2 className="class-title-text">{classDetail.class_name}</h2>
          </div>

          {(currentRole === 0 || (currentRole === 1 && classDetail.created_by && String(classDetail.created_by) === String(currentUserId))) && (
            <button
              className="edit-btn"
              onClick={() => navigate(`/class/${class_id}/edit`)}
              title="แก้ไขรายวิชา"
            >
              <FiEdit2 size={15} /> แก้ไขรายวิชา
            </button>
          )}
        </div>

        <div className="class-card-body">
          <div className="class-description-row">
            <FiInfo className="info-icon" size={18} />
            <div>
              <span className="class-description-label">คำอธิบายรายวิชา :</span>
              <p className="class-description">
                {classDetail.class_describe || "ไม่มีข้อมูลคำอธิบายรายวิชา"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="assignment-section">
        <div className="assignment-section-header">
          <div className="section-title-group">
            <div className="section-icon-box">
              <FiLayers size={22} />
            </div>
            <div>
              <h3 className="section-main-title">ผลงานในรายวิชา</h3>
              <p className="section-subtitle">
                พบบทเรียนและผลงานทั้งหมด {assignments.length} ชิ้น
              </p>
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-assignment-box">
            <FiLayers size={42} className="empty-icon" />
            <h4>ยังไม่มีผลงานในรายวิชานี้</h4>
            <p>นิสิตและอาจารย์สามารถสร้างผลงานเพื่อส่งในรายวิชานี้ได้</p>
          </div>
        ) : (
          <div className="assignment-grid">
            {currentAssignments.map((a) => {
              const canDeleteAssignment =
                currentRole === 0 ||
                currentRole === 1 ||
                (currentRole === 2 && currentUserId === a.created_by);

              return (
                <div
                  key={a.assignment_id}
                  className="assignment-card"
                  onClick={() => navigate(`/assignment/${a.assignment_id}`)}
                >
                  <div className="assignment-card-top-accent" />

                  <div className="assignment-card-header">
                    <span className="assignment-type">{a.assignment_type || "ผลงาน"}</span>

                    {canDeleteAssignment && (
                      <button
                        className="delete-assignment-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(a.assignment_id);
                        }}
                        title="ลบผลงาน"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>

                  <h4 className="assignment-title">{a.assignment_name}</h4>

                  <div className="assignment-meta">
                    <span className="assignment-date">
                      อัปเดตเมื่อ : {new Date(a.created_datetime).toLocaleDateString("th-TH")}
                    </span>
                  </div>

                  <div className="assignment-footer">
                    <span className="view-count">
                      <FiEye size={13} /> {formatViewCount(a.view_cnt)}
                    </span>

                    <span className="view-detail">
                      เข้าชม <FiArrowRight className="arrow-icon" />
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
          <button
            className="pagination-arrow"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <FiChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-num-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination-arrow"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFolder,
  FiPlusSquare,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiShield,
  FiUser,
  FiSearch,
  FiLayers,
  FiAlertTriangle,
} from "react-icons/fi";
import { formatThaiYear, calculateExpiryInfo } from "../../utils/dateUtils";
import {
  getAssignmentByUser,
  deleteAssignment,
} from "../../services/assignment.service";
import "../../css/assignments/AssignmentManagement.css";
import { toast } from "react-toastify";

type AssignmentItem = {
  assignment_id: number;
  class_id: string;
  class_name?: string;
  assignment_name: string;
  assignment_type?: string;
  created_by?: string;
  author_name?: string;
  author_role?: number;
  created_datetime?: string;
  retention_days?: number;
  expires_at?: string;
  days_remaining?: number;
  is_expired?: boolean;
  is_expiring_soon?: boolean;
  file_count?: number;
  assignment_link?: string;
  has_files?: boolean;
  has_link?: boolean;
  has_no_resources?: boolean;
};

function AssignmentManagement() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const role = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const isAdmin = Number(role) === 0;
  const currentUserId = localStorage.getItem("user_id");

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const data = await getAssignmentByUser();
        setAssignments(data || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "โหลดผลงานไม่สำเร็จ");
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "ลบผลงานไม่สำเร็จ");
    }
  };

  const myAssignments = assignments.filter(
    (a) => a.created_by && currentUserId && String(a.created_by) === String(currentUserId)
  );

  const displayedList = isAdmin && activeTab === "mine" ? myAssignments : assignments;

  const filteredAssignments = displayedList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (a.assignment_name && a.assignment_name.toLowerCase().includes(q)) ||
      (a.class_id && a.class_id.toLowerCase().includes(q)) ||
      (a.class_name && a.class_name.toLowerCase().includes(q)) ||
      (a.author_name && a.author_name.toLowerCase().includes(q)) ||
      (a.assignment_type && a.assignment_type.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="assignment-management-loading">
          <p>{isAdmin ? "กำลังโหลดผลงานทั้งหมดในระบบ..." : "กำลังโหลดผลงานของคุณ..."}</p>
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
            <h2 className="page-title">
              {isAdmin ? "ผลงานทั้งหมดในระบบ (ดูแลระบบ)" : "ผลงานของฉัน"}
            </h2>
            <p className="page-subtitle">
              {isAdmin
                ? `จัดการและตรวจสอบผลงานทั้งหมดในระบบที่คุณมีสิทธิ์กำกับดูแล (${filteredAssignments.length} ชิ้น)`
                : `จัดการและตรวจสอบผลงานทั้งหมดที่คุณได้สร้างขึ้น (${filteredAssignments.length} ชิ้น)`}
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

      {isAdmin && (
        <div className="assignment-admin-toolbar">
          <div className="assignment-tabs">
            <button
              className={`assignment-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <FiLayers size={16} />
              <span>ผลงานทั้งหมดในระบบ</span>
              <span className="tab-count-badge">{assignments.length}</span>
            </button>

            <button
              className={`assignment-tab-btn ${activeTab === "mine" ? "active" : ""}`}
              onClick={() => setActiveTab("mine")}
            >
              <FiUser size={16} />
              <span>ผลงานที่ฉันสร้าง</span>
              <span className="tab-count-badge">{myAssignments.length}</span>
            </button>
          </div>

          <div className="assignment-search-box">
            <FiSearch size={16} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผลงาน, รหัสวิชา หรือชื่อผู้จัดทำ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="assignment-search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="ล้างคำค้นหา"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      )}

      {filteredAssignments.length === 0 ? (
        <div className="empty-assignment-card">
          <FiFolder size={48} className="empty-icon" />
          {searchQuery ? (
            <>
              <h3>ไม่พบผลงานที่ตรงกับคำค้นหา</h3>
              <p>กรุณาลองค้นหาใหม่อีกครั้ง หรือล้างคำค้นหาเพื่อแสดงผลงานทั้งหมด</p>
              <button
                className="btn-primary"
                onClick={() => setSearchQuery("")}
              >
                ล้างคำค้นหา
              </button>
            </>
          ) : (
            <>
              <h3>{isAdmin ? "ยังไม่มีผลงานในระบบ" : "ยังไม่มีผลงานที่สร้าง"}</h3>
              <p>
                {isAdmin
                  ? "ยังไม่พบผลงานที่ถูกสร้างหรือบันทึกไว้ในระบบ สามารถเพิ่มผลงานใหม่เพื่อเริ่มต้นคลังการเรียนรู้ได้"
                  : "คุณสามารถสร้างผลงานใหม่เพื่อจัดเก็บในคลังการเรียนรู้ได้"}
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/create-assignment")}
              >
                <FiPlusSquare /> สร้างผลงานแรก
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="my-assignment-grid">
          {filteredAssignments.map((a) => {
            const expiry = calculateExpiryInfo(a.created_datetime, a.retention_days || 365);
            return (
              <div
                key={a.assignment_id}
                className="my-assignment-card"
                onClick={() => navigate(`/assignment/${a.assignment_id}`)}
              >
                <div className="card-top-line" />

                <div className="my-assignment-top">
                  <div className="my-assignment-badges">
                    <span className="class-badge" title={a.class_name ? `${a.class_id} - ${a.class_name}` : a.class_id}>
                      <FiBookOpen size={13} /> {a.class_id}
                    </span>

                    {a.author_name && (
                      <span
                        className="assignment-author-badge"
                        title={`ผู้จัดทำผลงาน: ${a.author_name}`}
                      >
                        <FiUser size={12} />
                        {a.author_name}
                      </span>
                    )}

                    {a.created_datetime && (
                      <span
                        className="assignment-year-badge"
                        title={`ปี พ.ศ. ที่จัดทำผลงาน: ${formatThaiYear(a.created_datetime)}`}
                      >
                        <FiCalendar size={12} />
                        {formatThaiYear(a.created_datetime)}
                      </span>
                    )}

                    <span className="assignment-permanent-chip" title="ไฟล์แนบจัดเก็บบนระบบ UP PJ-Hub ถาวร">
                      <FiShield size={11} /> จัดเก็บถาวร
                    </span>

                    {a.has_no_resources && (
                      <span
                        className="assignment-no-resource-chip"
                        title="⚠️ ผลงานนี้ยังไม่มีไฟล์แนบและไม่มีลิงก์ภายนอก"
                      >
                        <FiAlertTriangle size={11} /> ไม่มีไฟล์/ลิงก์
                      </span>
                    )}

                    {expiry && (
                      <span
                        className={`assignment-expiry-chip ${expiry.badgeClass}`}
                        title={`รอบทบทวนคุณภาพประจำปี: ${expiry.expiryFormatted} (${expiry.remainingLabel})`}
                      >
                        <FiClock size={12} />
                        {expiry.isExpired
                          ? "ถึงรอบทบทวน"
                          : expiry.isExpiringSoon
                          ? `ใกล้ครบกำหนด (${expiry.daysRemaining} วัน)`
                          : `รอบทบทวน ${expiry.daysRemaining} วัน`}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="my-assignment-title" title={a.assignment_name}>
                  {a.assignment_name}
                </h3>

                {a.class_name && (
                  <p className="my-assignment-class-name" title={a.class_name}>
                    {a.class_name}
                  </p>
                )}

                {expiry && (
                  <div className="my-assignment-lifecycle-info">
                    <span className="lifecycle-expiry-date" title={`รอบทบทวนคุณภาพประจำปี: ${expiry.expiryFormatted}`}>
                      รอบทบทวน: {expiry.expiryFormatted}
                    </span>
                    <span className={`lifecycle-remaining-tag ${expiry.status}`}>
                      {expiry.remainingLabel}
                    </span>
                  </div>
                )}

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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssignmentManagement;


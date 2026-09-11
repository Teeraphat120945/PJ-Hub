import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  fetchClasses,
  deleteClass,
  formatViewCount,
  type Class,
} from "../services/class.service";
import {
  searchAssignments,
  type SearchAssignmentResult,
} from "../services/assignment.service";
import {
  FiSearch,
  FiBookOpen,
  FiTrash2,
  FiInfo,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiSmartphone,
  FiCalendar,
  FiTag,
  FiLayers,
  FiEye,
} from "react-icons/fi";
import { formatThaiYear } from "../utils/dateUtils";
import "../css/Home.css";

const ITEMS_PER_PAGE = 8;

type LayoutContextType = {
  setIsMobileOpen?: (open: boolean) => void;
  setIsSidebarOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
};

function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<SearchAssignmentResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "classes" | "assignments">("all");

  const outletContext = useOutletContext<LayoutContextType>() || {};
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const role = (() => {
    const storedRole = localStorage.getItem("role_flg");
    return storedRole !== null ? Number(storedRole) : null;
  })();

  const isSearching = Boolean(search.trim());

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const query = search.trim();
        const [classesData, assignmentsData] = await Promise.all([
          fetchClasses(query || undefined),
          query ? searchAssignments(query) : Promise.resolve([]),
        ]);
        setClasses(classesData || []);
        setAssignments(assignmentsData || []);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [token, search]);

  const currentUserId = localStorage.getItem("user_id");

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm(`คุณต้องการลบรายวิชา ${classId} ใช่หรือไม่?`)) return;
    try {
      await deleteClass(classId);
      const query = search.trim();
      const [classesData, assignmentsData] = await Promise.all([
        fetchClasses(query || undefined),
        query ? searchAssignments(query) : Promise.resolve([]),
      ]);
      setClasses(classesData || []);
      setAssignments(assignmentsData || []);
      setCurrentPage(1);
      toast.success("ลบรายวิชาสำเร็จ");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "ลบรายวิชาไม่สำเร็จ");
    }
  };

  const totalPages = Math.ceil(classes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentClasses = classes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="home-field">
      <div className="home-hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">ระบบคลังรายวิชาและผลงานในการเรียนรู้</h1>
          <p className="hero-subtitle">
            ค้นหา และจัดการรายวิชา ผลงานของนิสิต เอกสารประกอบการสอนในระบบเดียว
          </p>

          <div className="home-search-container">
            <div className="home-search-input-wrapper">
              <FiSearch className="search-icon" size={20} />
              <input
                type="text"
                className="home-home-search"
                placeholder="ค้นหารายวิชา / ชื่อผลงาน / แท็ก / ปี พ.ศ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="home-clear-btn"
                  onClick={() => setSearch("")}
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSearching && (
        <div className="home-search-meta-bar">
          <div className="search-filter-tabs">
            <button
              className={`search-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              ทั้งหมด ({classes.length + assignments.length})
            </button>
            <button
              className={`search-tab-btn ${activeTab === "classes" ? "active" : ""}`}
              onClick={() => setActiveTab("classes")}
            >
              <FiBookOpen size={14} /> รายวิชา ({classes.length})
            </button>
            <button
              className={`search-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
              onClick={() => setActiveTab("assignments")}
            >
              <FiLayers size={14} /> ผลงาน ({assignments.length})
            </button>
          </div>
        </div>
      )}

      {/* ส่วนแสดงผลงานที่พบ (เมื่อมีการค้นหา) */}
      {isSearching && (activeTab === "all" || activeTab === "assignments") && assignments.length > 0 && (
        <div className="home-search-section">
          <div className="home-section-header">
            <div className="section-title-group">
              <div className="section-icon-box assignment-accent">
                <FiLayers size={22} />
              </div>
              <div>
                <h2 className="section-main-title">ผลงานที่พบ</h2>
                <p className="section-subtitle">
                  พบผลงานที่ตรงกับคำค้นหา "{search}" ทั้งหมด {assignments.length} ชิ้น
                </p>
              </div>
            </div>
          </div>

          <div className="home-assignment-grid">
            {assignments.map((item) => (
              <div
                key={item.assignment_id}
                className="home-assignment-search-card"
                onClick={() => {
                  outletContext.setIsMobileOpen?.(false);
                  outletContext.setIsSidebarOpen?.(false);
                  navigate(`/assignment/${item.assignment_id}`);
                }}
              >
                <div className="card-top-accent assignment-accent" />

                <div className="home-assignment-search-header">
                  <div className="assignment-search-badges">
                    <span className="assignment-type-tag">
                      {item.assignment_type || "ผลงาน"}
                    </span>
                    {item.created_datetime && (
                      <span className="class-year-badge">
                        <FiCalendar size={12} />
                        {formatThaiYear(item.created_datetime)}
                      </span>
                    )}
                  </div>

                  <span className="assignment-class-badge" title={item.class_name}>
                    <FiBookOpen size={12} /> {item.class_id}
                  </span>
                </div>

                <div className="home-assignment-search-content">
                  <h3 className="assignment-search-title">{item.assignment_name}</h3>
                  <p className="assignment-search-class-name">
                    รายวิชา: {item.class_name}
                  </p>
                  {item.assignment_detail && (
                    <p className="assignment-search-describe">
                      {item.assignment_detail}
                    </p>
                  )}
                </div>

                <div className="home-assignment-footer">
                  <span className="view-count">
                    <FiEye size={13} /> {formatViewCount(item.view_cnt)}
                  </span>
                  <span className="view-detail">
                    เข้าชมผลงาน <FiArrowRight className="arrow-icon" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ส่วนแสดงรายวิชา */}
      {(activeTab === "all" || activeTab === "classes") && (
        <div className="home-classes-section">
          <div className="home-section-header">
            <div className="section-title-group">
              <div className="section-icon-box">
                <FiBookOpen size={22} />
              </div>
              <div>
                <h2 className="section-main-title">
                  {isSearching ? `รายวิชาที่พบ` : `รายวิชาทั้งหมด`}
                </h2>
                <p className="section-subtitle">
                  {isSearching
                    ? `พบรายวิชาที่ตรงกับคำค้นหา ${classes.length} รายวิชา`
                    : `พบบริบทการเรียนรู้ทั้งหมด ${classes.length} รายวิชา`}
                </p>
              </div>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="empty-classes-box">
              <FiBookOpen className="empty-icon" size={48} />
              <h3>ไม่พบข้อมูลรายวิชา</h3>
              <p>
                {isSearching
                  ? `ไม่พบรายวิชาที่ตรงกับคำค้นหา "${search}"`
                  : `ลองค้นหาด้วยคำอื่น หรือเพิ่มรายวิชาใหม่ในระบบ`}
              </p>
            </div>
          ) : (
            <div className="home-class-grid">
              {currentClasses.map((item) => {
                const canDeleteClass =
                  role === 0 ||
                  (role === 1 && item.created_by && String(item.created_by) === String(currentUserId));

                return (
                  <div
                    key={item.class_id}
                    className="home-class-card"
                    onClick={() => {
                      outletContext.setIsMobileOpen?.(false);
                      outletContext.setIsSidebarOpen?.(false);
                      navigate(`/class/${item.class_id}`);
                    }}
                  >
                    <div className="card-top-accent" />

                    <div className="home-class-card-header">
                      <div className="class-badges-group">
                        <span className="class-code-badge">
                          <FiSmartphone size={14} />
                          {item.class_id}
                        </span>

                        {item.created_datetime && (
                          <span
                            className="class-year-badge"
                            title={`ปี พ.ศ. ที่สร้างรายวิชา: ${formatThaiYear(item.created_datetime)}`}
                          >
                            <FiCalendar size={13} />
                            {formatThaiYear(item.created_datetime)}
                          </span>
                        )}

                        {item.is_responsible && (
                          <span className="class-status-pill responsible" title="คุณมีสิทธิ์จัดการรายวิชานี้">
                            วิชาที่คุณสอน
                          </span>
                        )}
                        {!item.is_responsible && item.is_enrolled && (
                          <span className="class-status-pill enrolled" title="คุณลงทะเบียนในรายวิชานี้">
                            วิชาของคุณ
                          </span>
                        )}
                      </div>

                      {canDeleteClass && (
                        <button
                          className="home-delete-class-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(item.class_id);
                          }}
                          title="ลบรายวิชา"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="home-class-card-content">
                      <h3 className="class-card-title">{item.class_name}</h3>
                      <div className="class-describe-wrapper">
                        <FiInfo size={15} className="info-icon" />
                        <p className="class-describe">
                          {item.class_describe || item.class_name}
                        </p>
                      </div>

                      {/* ไฮไลต์ถ้าวิชานี้ถูกค้นพบเพราะมีผลงานประเภทตรงกับคำค้นหา */}
                      {isSearching && item.matched_types && (
                        <div className="class-matched-tag-box" title={`มีผลงานประเภท ${item.matched_types} ในรายวิชานี้`}>
                          <FiTag size={13} />
                          <span>พบผลงานในวิชา: <strong>{item.matched_types}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="home-assignment-footer">
                      <span className="view-detail">
                        เข้าสู่รายวิชา <FiArrowRight className="arrow-icon" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
                  className={`page-num-btn ${page === currentPage ? "active" : ""}`}
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
      )}

      {/* ถ้าค้นหาแล้วไม่พบอะไรเลยทั้งผลงานและรายวิชา */}
      {isSearching && classes.length === 0 && assignments.length === 0 && (
        <div className="empty-classes-box search-empty-box">
          <FiSearch className="empty-icon" size={48} />
          <h3>ไม่พบข้อมูลที่ตรงกับคำค้นหา "{search}"</h3>
          <p>ลองค้นหาด้วยคำอื่น เช่น รหัสวิชา, ชื่อวิชา, คำอธิบาย, ชื่องาน, แท็กประเภท หรือปี พ.ศ.</p>
          <button className="btn-clear-search-cta" onClick={() => setSearch("")}>
            ล้างคำค้นหา
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;


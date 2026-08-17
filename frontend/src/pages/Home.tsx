import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  fetchClasses,
  deleteClass,
  type Class,
} from "../services/class.service";
import {
  FiSearch,
  FiBookOpen,
  FiTrash2,
  FiInfo,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiSmartphone
} from "react-icons/fi";
import "../css/Home.css";

const ITEMS_PER_PAGE = 8;

type LayoutContextType = {
  setIsMobileOpen?: (open: boolean) => void;
  setIsSidebarOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
};

function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const outletContext = useOutletContext<LayoutContextType>() || {};
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const role = (() => {
    const storedRole = localStorage.getItem("role_flg");
    return storedRole !== null ? Number(storedRole) : null;
  })();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await fetchClasses(search.trim() || undefined);
        setClasses(data);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [token, search]);

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm(`คุณต้องการลบรายวิชา ${classId} ใช่หรือไม่?`)) return;
    try {
      await deleteClass(classId);
      const data = await fetchClasses(search.trim() || undefined);
      setClasses(data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
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
                placeholder="ค้นหารายวิชา / ชื่อผลงาน / แท็ก..."
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

      <div className="home-section-header">
        <div className="section-title-group">
          <div className="section-icon-box">
            <FiBookOpen size={22} />
          </div>
          <div>
            <h2 className="section-main-title">รายวิชาทั้งหมด</h2>
            <p className="section-subtitle">
              พบบริบทการเรียนรู้ทั้งหมด {classes.length} รายวิชา
            </p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-classes-box">
          <FiBookOpen className="empty-icon" size={48} />
          <h3>ไม่พบข้อมูลรายวิชา</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือเพิ่มรายวิชาใหม่ในระบบ</p>
        </div>
      ) : (
        <div className="home-class-grid">
          {currentClasses.map((item) => {
            const canDeleteClass = role === 0 || role === 1;

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
                  <span className="class-code-badge">
                    <FiSmartphone size={14} />
                    {item.class_id}
                  </span>

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
  );
}

export default Home;


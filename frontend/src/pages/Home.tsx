import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import {
  fetchClasses,
  deleteClass,
  type Class,
} from "../services/class.service";
import "../css/Home.css";
import "../css/Auth.css";

const ITEMS_PER_PAGE = 9;

type LayoutContextType = {
  setIsSidebarOpen: (open: boolean) => void;
};

function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const { setIsSidebarOpen } = useOutletContext<LayoutContextType>();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
 
  const role = (() => {
    const storedRole = localStorage.getItem("role_flg");
    return storedRole ? Number(storedRole) : null;
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
      <div className="home-hero">
        <div>
          <span className="eyebrow">PROJECT PORTFOLIO HUB</span>
          <h1>ค้นพบรายวิชาและผลงาน</h1>
          <p>พื้นที่รวบรวมผลงาน แลกเปลี่ยนไอเดีย และติดตามโปรเจกต์ในแต่ละรายวิชา</p>
        </div>
        <div className="hero-visual" aria-hidden="true"><FiBookOpen /></div>
      </div>
      <div className="home-search-wrapper">
        <div className="home-search-input-wrapper">
          <FiSearch className="home-search-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="home-search">ค้นหารายวิชา ผลงาน หรือแท็ก</label>
          <input
            id="home-search"
            type="text"
            className="home-home-search"
            placeholder="ค้นหารายวิชา / ผลงาน / tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button className="home-clear-btn" aria-label="ล้างคำค้นหา" onClick={() => setSearch("")}>
              <FiX />
            </button>
          )}
        </div>
      </div>

      <div className="home-header">
        <div><span className="eyebrow">EXPLORE</span><h2>รายวิชาทั้งหมด</h2></div>
        <span className="result-count">{classes.length} รายวิชา</span>
      </div>

      <div className="home-class-grid">
        {currentClasses.length === 0 && (
          <div className="empty-state home-empty-state">
            <span className="empty-state-icon"><FiSearch /></span>
            <h3>{search ? "ไม่พบรายวิชาที่ตรงกับคำค้นหา" : "ยังไม่มีรายวิชา"}</h3>
            <p>{search ? "ลองใช้ชื่อวิชา รหัสวิชา หรือคำค้นหาอื่น" : "รายวิชาที่เปิดเผยจะแสดงที่นี่"}</p>
          </div>
        )}
        {currentClasses.map((item) => {
          const canDeleteClass = role === 0 || role === 1;

          return (
            <div
              key={item.class_id}
              className="home-class-card"
              role="link"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/class/${item.class_id}`);
                }
              }}
              onClick={() => {
                setIsSidebarOpen(false);
                navigate(`/class/${item.class_id}`);
              }}
            >
              <div className="home-class-card-header">
                <div className="course-heading"><span className="course-icon"><FiBookOpen /></span><div><span className="course-code">{item.class_id}</span><h3>{item.class_name}</h3></div></div>

                {canDeleteClass && (
                  <button
                    className="home-delete-class-btn"
                    aria-label={`ลบรายวิชา ${item.class_name}`}
                    title="ลบรายวิชา"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(item.class_id);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <div className="home-class-card-content">
                <p>{item.class_describe || "ยังไม่มีคำอธิบายรายวิชา"}</p>
              </div>

              <div className="home-assignment-footer">
                <span className="view-detail">ดูรายละเอียด <FiArrowRight /></span>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="home-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={page === currentPage ? "active" : ""}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;

import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
      <div className="home-search-wrapper">
        <span className="home-search-label">ค้นหา :</span>

        <div className="home-search-input-wrapper">
          <input
            type="text"
            className="home-home-search"
            placeholder="ค้นหารายวิชา / ผลงาน / tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button className="home-clear-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="home-header">
        <h2>รายวิชาทั้งหมด</h2>
      </div>

      <div className="home-class-grid">
        {currentClasses.map((item) => {
          const canDeleteClass = role === 0 || role === 1;

          return (
            <div
              key={item.class_id}
              className="home-class-card"
              onClick={() => {
                setIsSidebarOpen(false);
                navigate(`/class/${item.class_id}`);
              }}
            >
              <div className="home-class-card-header">
                <h3>
                  {item.class_id} : {item.class_name}
                </h3>

                {canDeleteClass && (
                  <button
                    className="home-delete-class-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(item.class_id);
                    }}
                  >
                    ลบ
                  </button>
                )}
              </div>

              <div className="home-class-card-content">
                <p>รายละเอียด : {item.class_describe || "-"}</p>
              </div>

              <div className="home-assignment-footer">
                <span className="view-detail">View detail →</span>
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

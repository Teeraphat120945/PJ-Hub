import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../services/auth.service";
import "../css/MainLayout.css";

function MainLayout() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getProfile()
      .then((data) => {
        setIsLogin(true);
        setUsername(data.user_name);
        setRole(data.role);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
    }, [navigate]);
  
    const handleLogout = () => {
      localStorage.removeItem("token");
      setIsLogin(false);
      setUsername(null);
      navigate("/login");
    };

  return (
    <div className="layout">
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        
        <button
          className="sidebar-close"
          onClick={() => setIsSidebarOpen(false)}
        >
          ☰
        </button>

        <h3 className="sidebar-title">เมนูผู้ใช้งาน</h3>
      </div>
      {(role !== null) && (
      <ul className="sidebar-menu">
        <li>
          <Link className="sidebar-link" to="/" onClick={() => setIsSidebarOpen(false)}>• หน้าหลัก</Link>
        </li>
        {(role !== 3 ) && (
        <>
        <li>
              <Link className="sidebar-link" to="/create-assignment" onClick={() => setIsSidebarOpen(false)}>
                • เพิ่มผลงาน
              </Link>
          </li>
          <li>
              <Link className="sidebar-link" to="/assignments" onClick={() => setIsSidebarOpen(false)}>
                • ผลงานของฉัน
              </Link>
          </li>
        </>
        )}
        {(role === 0 || role === 1) && (
          <>
            <li>
              <Link className="sidebar-link" to="/CreateClass" onClick={() => setIsSidebarOpen(false)}>
                • เพิ่มรายวิชา
              </Link>
            </li> 

            <li>
              <Link className="sidebar-link" to="/TeacherClassManagement" onClick={() => setIsSidebarOpen(false)}>
                • รายวิชาที่สอน
              </Link>
            </li>

            <li>
              <Link className="sidebar-link" to="/ClassUserManagement" onClick={() => setIsSidebarOpen(false)}>
                • จัดการผู้ใช้ในรายวิชา
              </Link>
            </li>
          </>
        )}
         {(role === 0) && (
        <li>
            <Link className="sidebar-link" to="/UserManagement" onClick={() => setIsSidebarOpen(false)}>
              • จัดการผู้ใช้งาน
            </Link>
          </li>
        )}

         
      </ul>
      )}
    </aside>

      <div className="main">
        <header className="header">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
        
          {!isLogin ? (
            <button onClick={() => navigate("/login")}>Login</button>
          ) : (
              <div className="user-info">
                <span>{username}</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
          )}
        </header>

        <div className="content">
          <Outlet context={{ setIsSidebarOpen }} />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;

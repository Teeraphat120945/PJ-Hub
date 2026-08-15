import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiBookOpen,
  FiFolder,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiPlusCircle,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { getProfile } from "../services/auth.service";
import universityLogo from "../assets/symbol_logo_up_1777530426.webp";
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
      <button
        type="button"
        className={`sidebar-backdrop ${isSidebarOpen ? "visible" : ""}`}
        aria-label="ปิดเมนู"
        tabIndex={isSidebarOpen ? 0 : -1}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="brand-mark brand-mark-logo"><img src={universityLogo} alt="ตราสัญลักษณ์มหาวิทยาลัยพะเยา" /></div>
        <div className="brand-copy">
          <strong>PJ Hub</strong>
          <span>พื้นที่แบ่งปันผลงาน</span>
        </div>
        <button className="sidebar-close" aria-label="ปิดเมนู" onClick={() => setIsSidebarOpen(false)}>
          <FiX />
        </button>
      </div>
      <ul className="sidebar-menu">
        <li className="sidebar-section-label">ทั่วไป</li>
        <li>
          <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/" end onClick={() => setIsSidebarOpen(false)}>
            <FiHome /><span>หน้าหลัก</span>
          </NavLink>
        </li>
        {(role !== null) && (
        <>
        {(role !== 3 ) && (
        <>
        <li className="sidebar-section-label">ผลงาน</li>
        <li>
              <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/create-assignment" onClick={() => setIsSidebarOpen(false)}>
                <FiPlusCircle /><span>เพิ่มผลงาน</span>
              </NavLink>
          </li>
          <li>
              <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/assignments" onClick={() => setIsSidebarOpen(false)}>
                <FiFolder /><span>ผลงานของฉัน</span>
              </NavLink>
          </li>
        </>
        )}
        {(role === 0 || role === 1) && (
          <>
            <li className="sidebar-section-label">รายวิชา</li>
            <li>
              <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/CreateClass" onClick={() => setIsSidebarOpen(false)}>
                <FiPlusCircle /><span>เพิ่มรายวิชา</span>
              </NavLink>
            </li> 

            <li>
              <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/TeacherClassManagement" onClick={() => setIsSidebarOpen(false)}>
                <FiBookOpen /><span>รายวิชาที่สอน</span>
              </NavLink>
            </li>

            <li>
              <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/ClassUserManagement" onClick={() => setIsSidebarOpen(false)}>
                <FiUserCheck /><span>ผู้ใช้ในรายวิชา</span>
              </NavLink>
            </li>
          </>
        )}
         {(role === 0) && (
        <>
        <li className="sidebar-section-label">ผู้ดูแลระบบ</li>
        <li>
            <NavLink className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} to="/UserManagement" onClick={() => setIsSidebarOpen(false)}>
              <FiUsers /><span>จัดการผู้ใช้งาน</span>
            </NavLink>
          </li>
        </>
        )}
        </>
        )}
      </ul>
      <div className="sidebar-footer">
        <span>Project Portfolio Hub</span>
      </div>
    </aside>

      <div className="main">
        <header className="header">
          <div className="header-leading">
            <button className="menu-trigger" aria-label="เปิดเมนู" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FiMenu />
            </button>
            <div className="mobile-brand"><span className="brand-mark brand-mark-logo"><img src={universityLogo} alt="" /></span><strong>PJ Hub</strong></div>
          </div>
        
          {!isLogin ? (
            <button className="header-auth-btn" onClick={() => navigate("/login")}><FiLogIn /> เข้าสู่ระบบ</button>
          ) : (
              <div className="user-info">
                <span className="user-avatar"><FiUser /></span>
                <div className="user-copy"><small>เข้าสู่ระบบเป็น</small><strong>{username}</strong></div>
                <button className="logout-btn" aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={handleLogout}><FiLogOut /></button>
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

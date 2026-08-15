import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../services/auth.service";
import {
  FiGrid,
  FiPlusSquare,
  FiFolder,
  FiBookOpen,
  FiUsers,
  FiShield,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX
} from "react-icons/fi";
import "../css/MainLayout.css";

function MainLayout() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getProfile()
      .then((data) => {
        setIsLogin(true);
        setUsername(data.user_name);
        setRole(data.role);
        if (data.role !== undefined && data.role !== null) {
          localStorage.setItem("role_flg", String(data.role));
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role_flg");
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role_flg");
    setIsLogin(false);
    setUsername(null);
    setRole(null);
    navigate("/login");
  };

  const getRoleBadge = (roleNum: number | null) => {
    switch (roleNum) {
      case 0:
        return { label: "ผู้ดูแลระบบ", className: "role-badge-admin" };
      case 1:
        return { label: "อาจารย์", className: "role-badge-teacher" };
      case 2:
        return { label: "นิสิต", className: "role-badge-student" };
      default:
        return { label: "ผู้ใช้งาน", className: "role-badge-guest" };
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="up-logo-badge">UP</div>
            <div className="brand-text">
              <span className="brand-title">มหาวิทยาลัยพะเยา</span>
              <span className="brand-subtitle">Classroom Hub</span>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">เมนูหลัก</div>
          <ul className="sidebar-menu">
            <li>
              <Link
                className={`sidebar-link ${isActive("/") ? "active" : ""}`}
                to="/"
                onClick={() => setIsSidebarOpen(false)}
              >
                <FiGrid className="link-icon" />
                <span>หน้าหลัก</span>
              </Link>
            </li>
          </ul>

          {role !== 3 && role !== null && (
            <>
              <div className="sidebar-section-title">สำหรับผู้ใช้งาน</div>
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/create-assignment") ? "active" : ""}`}
                    to="/create-assignment"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiPlusSquare className="link-icon" />
                    <span>เพิ่มผลงาน</span>
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/assignments") ? "active" : ""}`}
                    to="/assignments"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiFolder className="link-icon" />
                    <span>ผลงานของฉัน</span>
                  </Link>
                </li>
              </ul>
            </>
          )}

          {(role === 0 || role === 1) && (
            <>
              <div className="sidebar-section-title">จัดการการเรียนการสอน</div>
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/CreateClass") ? "active" : ""}`}
                    to="/CreateClass"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiPlusSquare className="link-icon" />
                    <span>เพิ่มรายวิชา</span>
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/TeacherClassManagement") ? "active" : ""}`}
                    to="/TeacherClassManagement"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiBookOpen className="link-icon" />
                    <span>รายวิชาที่สอน</span>
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/ClassUserManagement") ? "active" : ""}`}
                    to="/ClassUserManagement"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiUsers className="link-icon" />
                    <span>จัดการนิสิตในวิชา</span>
                  </Link>
                </li>
              </ul>
            </>
          )}

          {role === 0 && (
            <>
              <div className="sidebar-section-title">ผู้ดูแลระบบ</div>
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/UserManagement") ? "active" : ""}`}
                    to="/UserManagement"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FiShield className="link-icon" />
                    <span>จัดการผู้ใช้งาน</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>

        {isLogin && username && (
          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              <div className="user-avatar-circle">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name-text">{username}</span>
                <span className={`user-role-badge ${getRoleBadge(role).className}`}>
                  {getRoleBadge(role).label}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="main">
        <header className="header">
          <div className="header-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FiMenu size={22} />
            </button>
            <div className="header-brand-mobile">
              <span className="up-header-icon">🏆</span>
              <span>UP Classroom</span>
            </div>
          </div>

          <div className="header-right">
            {!isLogin ? (
              <button className="btn-primary" onClick={() => navigate("/login")}>
                เข้าสู่ระบบ
              </button>
            ) : (
              <div className="user-info">
                <div className="header-user-badge">
                  <FiUser className="user-icon" />
                  <span className="username-text">{username}</span>
                  <span className={`role-chip ${getRoleBadge(role).className}`}>
                    {getRoleBadge(role).label}
                  </span>
                </div>
                <button className="header-logout-btn" onClick={handleLogout}>
                  <FiLogOut /> ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="content">
          <Outlet context={{ setIsSidebarOpen }} />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;


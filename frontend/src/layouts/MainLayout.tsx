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
  FiX,
  FiMenu
} from "react-icons/fi";
import "../css/MainLayout.css";

function MainLayout() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
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
          localStorage.setItem("role", String(data.role));
        }
        if (data.user_id) {
          localStorage.setItem("user_id", String(data.user_id));
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("role_flg");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user");
        setIsLogin(false);
        setUsername(null);
        setRole(null);
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("role_flg");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user");
    setIsLogin(false);
    setUsername(null);
    setRole(null);
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar_collapsed", String(next));
        return next;
      });
    } else {
      setIsMobileOpen((prev) => !prev);
    }
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
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <button
              type="button"
              className="up-logo-btn"
              onClick={toggleSidebar}
              title={isCollapsed ? "ขยายแถบเมนู (คลิกที่โลโก้ UP)" : "ย่อแถบเมนู (คลิกที่โลโก้ UP)"}
              aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
            >
              <div className="up-logo-badge">UP</div>
            </button>
            {!isCollapsed && (
              <div
                className="brand-text"
                onClick={toggleSidebar}
                title="ย่อแถบเมนู (คลิกที่โลโก้ UP)"
              >
                <span className="brand-title">มหาวิทยาลัยพะเยา</span>
                <span className="brand-subtitle">Classroom Hub</span>
              </div>
            )}
          </div>

          <button
            className="sidebar-close"
            onClick={() => setIsMobileOpen(false)}
            title="ปิดเมนู"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && <div className="sidebar-section-title">เมนูหลัก</div>}
          <ul className="sidebar-menu">
            <li>
              <Link
                className={`sidebar-link ${isActive("/") ? "active" : ""}`}
                to="/"
                onClick={() => setIsMobileOpen(false)}
                title="หน้าหลัก"
              >
                <FiGrid className="link-icon" />
                {!isCollapsed && <span>หน้าหลัก</span>}
              </Link>
            </li>
          </ul>

          {role !== 3 && role !== null && (
            <>
              {!isCollapsed ? (
                <div className="sidebar-section-title">สำหรับผู้ใช้งาน</div>
              ) : (
                <div className="sidebar-divider" />
              )}
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/create-assignment") ? "active" : ""}`}
                    to="/create-assignment"
                    onClick={() => setIsMobileOpen(false)}
                    title="เพิ่มผลงาน"
                  >
                    <FiPlusSquare className="link-icon" />
                    {!isCollapsed && <span>เพิ่มผลงาน</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/assignments") ? "active" : ""}`}
                    to="/assignments"
                    onClick={() => setIsMobileOpen(false)}
                    title="ผลงานของฉัน"
                  >
                    <FiFolder className="link-icon" />
                    {!isCollapsed && <span>ผลงานของฉัน</span>}
                  </Link>
                </li>
              </ul>
            </>
          )}

          {(role === 0 || role === 1) && (
            <>
              {!isCollapsed ? (
                <div className="sidebar-section-title">จัดการการเรียนการสอน</div>
              ) : (
                <div className="sidebar-divider" />
              )}
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/CreateClass") ? "active" : ""}`}
                    to="/CreateClass"
                    onClick={() => setIsMobileOpen(false)}
                    title="เพิ่มรายวิชา"
                  >
                    <FiPlusSquare className="link-icon" />
                    {!isCollapsed && <span>เพิ่มรายวิชา</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/TeacherClassManagement") ? "active" : ""}`}
                    to="/TeacherClassManagement"
                    onClick={() => setIsMobileOpen(false)}
                    title="รายวิชาที่สอน"
                  >
                    <FiBookOpen className="link-icon" />
                    {!isCollapsed && <span>รายวิชาที่สอน</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/ClassUserManagement") ? "active" : ""}`}
                    to="/ClassUserManagement"
                    onClick={() => setIsMobileOpen(false)}
                    title="จัดการนิสิตในวิชา"
                  >
                    <FiUsers className="link-icon" />
                    {!isCollapsed && <span>จัดการนิสิตในวิชา</span>}
                  </Link>
                </li>
              </ul>
            </>
          )}

          {role === 0 && (
            <>
              {!isCollapsed ? (
                <div className="sidebar-section-title">ผู้ดูแลระบบ</div>
              ) : (
                <div className="sidebar-divider" />
              )}
              <ul className="sidebar-menu">
                <li>
                  <Link
                    className={`sidebar-link ${isActive("/UserManagement") ? "active" : ""}`}
                    to="/UserManagement"
                    onClick={() => setIsMobileOpen(false)}
                    title="จัดการผู้ใช้งาน"
                  >
                    <FiShield className="link-icon" />
                    {!isCollapsed && <span>จัดการผู้ใช้งาน</span>}
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>

        {isLogin && username && (
          <div className="sidebar-footer">
            <div className="sidebar-user-card" title={`${username} (${getRoleBadge(role).label})`}>
              <div className="user-avatar-circle">
                {username.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="user-details">
                  <span className="user-name-text">{username}</span>
                  <span className={`user-role-badge ${getRoleBadge(role).className}`}>
                    {getRoleBadge(role).label}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className={`main ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={toggleSidebar}
              title="เปิดเมนูด้านข้าง"
              aria-label="Toggle Mobile Menu"
            >
              <FiMenu size={20} />
            </button>
            <div className="header-brand-mobile">
              <span className="up-header-icon">🏆</span>
              <span className="header-brand-text">UP Classroom</span>
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
                <button
                  className="header-logout-btn"
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  aria-label="ออกจากระบบ"
                >
                  <FiLogOut />
                  <span className="logout-btn-text">ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="content">
          <Outlet context={{ setIsMobileOpen, setIsSidebarOpen: setIsMobileOpen, isCollapsed }} />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;

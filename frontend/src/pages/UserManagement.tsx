import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiShield,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";
import {
  fetchUsers,
  updateUserRole,
  updateUserActive,
  fetchgetRoles,
  type User,
  type Role,
} from "../services/user.service";
import "../css/UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const usersData = await fetchUsers();
        const rolesData = await fetchgetRoles();

        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        console.error("LOAD ERROR:", err);
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const currentRole = Number(localStorage.getItem("role") || localStorage.getItem("role_flg"));
  const currentUserId = localStorage.getItem("user_id");

  const changeRole = async (user_id: string, role_flg: number) => {
    if (String(user_id) === String(currentUserId)) {
      toast.warning("ไม่สามารถเปลี่ยนระดับสิทธิ์ของบัญชีตนเองได้");
      return;
    }

    if (!window.confirm("ยืนยันการเปลี่ยนสิทธิ์ผู้ใช้?")) return;

    try {
      await updateUserRole(user_id, role_flg);

      setUsers((prev) =>
        prev.map((u) => (u.user_id === user_id ? { ...u, role_flg } : u)),
      );

      toast.success("เปลี่ยนสิทธิ์เรียบร้อย");
    } catch (err: any) {
      toast.error(err.message || "เปลี่ยนสิทธิ์ไม่สำเร็จ");
    }
  };

  const toggleActive = async (user: User) => {
    if (String(user.user_id) === String(currentUserId)) {
      toast.warning("ไม่สามารถปิดการใช้งานบัญชีของตนเองได้");
      return;
    }

    const actionText = user.deleted_flg === 0 ? "ปิดการใช้งาน" : "เปิดการใช้งาน";
    if (!window.confirm(`ยืนยันการ${actionText}ผู้ใช้รายนี้?`)) return;

    const newDeletedFlg: 0 | 1 = user.deleted_flg === 0 ? 1 : 0;

    try {
      await updateUserActive(user.user_id, newDeletedFlg);

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, deleted_flg: newDeletedFlg } : u,
        ),
      );

      toast.success("อัปเดตสถานะเรียบร้อย");
    } catch (err: any) {
      toast.error(err.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="user-management-loading">
          <p>กำลังโหลดข้อมูลผู้ใช้งาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="user-management-header">
        <div className="title-group">
          <div className="title-icon-box">
            <FiShield size={24} />
          </div>
          <div>
            <h2 className="page-title">จัดการผู้ใช้งานในระบบ</h2>
            <p className="page-subtitle">
              ตรวจสอบสิทธิ์การเข้าใช้งาน กำหนดบทบาท และระงับการเข้าถึงของผู้ใช้ ({users.length} คน)
            </p>
          </div>
        </div>

        <div className="user-management-search-wrapper">
          <FiSearch className="search-icon" size={18} />
          <input
            type="text"
            className="user-management-search-input"
            placeholder="ค้นหาชื่อผู้ใช้ หรือรหัสประจำตัว..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="ล้างคำค้นหา"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>รหัสผู้ใช้งาน</th>
              <th>ชื่อผู้ใช้</th>
              <th>สิทธิ์การใช้งาน (Role)</th>
              <th>สถานะบัญชี</th>
              <th>การจัดการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => {
              const isSelf = String(user.user_id) === String(currentUserId);

              return (
                <tr key={user.user_id}>
                  <td className="user-id-col">{user.user_id}</td>
                  <td>
                    <div className="user-cell-name">
                      <div className="user-cell-avatar">
                        {user.user_name ? user.user_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span>
                        {user.user_name} {isSelf && <strong style={{ color: "var(--up-gold)" }}>(คุณ)</strong>}
                      </span>
                    </div>
                  </td>

                  <td>
                    {isSelf ? (
                      <span className="member-role-chip role-chip-admin" title="บัญชีของคุณ">
                        {user.role_name || "ผู้ดูแลระบบ"}
                      </span>
                    ) : currentRole === 1 && (user.role_flg === 0 || user.role_flg === 1) ? (
                      <span className={`member-role-chip role-chip-${user.role_flg === 0 ? "admin" : "teacher"}`}>
                        {user.role_name || (user.role_flg === 0 ? "ผู้ดูแลระบบ" : "อาจารย์")}
                      </span>
                    ) : (
                      <select
                        className={`role-select role-flg-${user.role_flg}`}
                        value={user.role_flg}
                        onChange={(e) =>
                          changeRole(user.user_id, Number(e.target.value))
                        }
                      >
                        {roles
                          .filter((r) => currentRole === 0 || r.role_id === 2 || r.role_id === 3)
                          .map((role) => (
                            <option key={role.role_id} value={role.role_id}>
                              {role.role_name}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-chip ${user.deleted_flg === 0 ? "active" : "inactive"}`}
                    >
                      ● {user.deleted_flg === 0 ? "ใช้งานปกติ" : "ปิดการใช้งาน"}
                    </span>
                  </td>

                  <td>
                    {isSelf ? (
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }} title="ไม่สามารถแก้ไขสถานะบัญชีตนเองได้">
                        บัญชีปัจจุบัน
                      </span>
                    ) : currentRole === 0 ? (
                      <button
                        className={`btn-action-status ${user.deleted_flg === 0 ? "danger" : "success"}`}
                        onClick={() => toggleActive(user)}
                      >
                        {user.deleted_flg === 0 ? (
                          <>
                            <FiUserX size={15} /> ปิดใช้งาน
                          </>
                        ) : (
                          <>
                            <FiUserCheck size={15} /> เปิดใช้งาน
                          </>
                        )}
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        -
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="no-user-row">
                  <FiUsers size={36} style={{ color: "var(--up-purple-soft)", marginBottom: 8 }} />
                  <div>ไม่พบข้อมูลผู้ใช้ที่ตรงกับคำค้นหา</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
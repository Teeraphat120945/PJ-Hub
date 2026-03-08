import { useEffect, useState } from "react";
import { toast } from "react-toastify";
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
      console.log("finish loading");
      setLoading(false);
    }
  };

  load();
}, []);

  const changeRole = async (user_id: string, role_flg: number) => {
    if (!window.confirm("ยืนยันการเปลี่ยนสิทธิ์ผู้ใช้?")) return;

    try {
      await updateUserRole(user_id, role_flg);

      setUsers((prev) =>
        prev.map((u) => (u.user_id === user_id ? { ...u, role_flg } : u)),
      );

      toast.success("เปลี่ยนสิทธิ์เรียบร้อย");
    } catch {
      toast.error("เปลี่ยนสิทธิ์ไม่สำเร็จ");
    }
  };

  const toggleActive = async (user: User) => {
    if (!window.confirm("ยืนยันการเปลี่ยนสถานะผู้ใช้?")) return;

    const newDeletedFlg: 0 | 1 = user.deleted_flg === 0 ? 1 : 0;

    try {
      await updateUserActive(user.user_id, newDeletedFlg);

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, deleted_flg: newDeletedFlg } : u,
        ),
      );

      toast.success("อัปเดตสถานะเรียบร้อย");
    } catch {
      toast.error("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  if (loading) {
    return <p>กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="user-management-page">
      <h2>จัดการผู้ใช้งานในระบบ</h2>

      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>รหัสผู้ใช้งาน</th>
              <th>ชื่อผู้ใช้</th>
              <th>Role</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.user_name}</td>

                <td>
                  <select
                    className="role-select"
                    value={user.role_flg}
                    onChange={(e) =>
                      changeRole(user.user_id, Number(e.target.value))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <span
                    className={user.deleted_flg === 0 ? "active" : "inactive"}
                  >
                    {user.deleted_flg === 0 ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>

                <td>
                  <button
                    className={`btn ${user.deleted_flg === 0 ? "danger" : ""}`}
                    onClick={() => toggleActive(user)}
                  >
                    {user.deleted_flg === 0 ? "ปิด" : "เปิด"}
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  ไม่พบข้อมูลผู้ใช้
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
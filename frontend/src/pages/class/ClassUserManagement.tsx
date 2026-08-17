import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiBookOpen,
  FiUserPlus,
  FiTrash2,
  FiUser,
  FiCheckCircle,
  FiShield,
  FiUserCheck,
  FiRotateCcw,
} from "react-icons/fi";
import {
  fetchClasses,
  fetchClassUsers,
  addClassUser,
  removeClassUser,
  type Class,
  type ClassUser,
} from "../../services/classUser.service";
import { fetchAvailableUsers, updateUserRole, type User } from "../../services/user.service";
import "../../css/classes/ClassUserManagement.css";

const ROLE_TEXT: Record<number, { text: string; chipClass: string }> = {
  0: { text: "ผู้ดูแลระบบ", chipClass: "role-chip-admin" },
  1: { text: "อาจารย์", chipClass: "role-chip-teacher" },
  2: { text: "นิสิต", chipClass: "role-chip-student" },
  3: { text: "ผู้ใช้ทั่วไป", chipClass: "role-chip-guest" },
};

function ClassUserManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [users, setUsers] = useState<ClassUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [autoPromote, setAutoPromote] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => toast.error("โหลดรายวิชาไม่สำเร็จ"));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [classUsers, available] = await Promise.all([
          fetchClassUsers(selectedClassId),
          fetchAvailableUsers(selectedClassId),
        ]);

        if (!cancelled) {
          setUsers(classUsers.filter((u) => u.view_flg === 0));
          setAvailableUsers(available);
        }
      } catch {
        if (!cancelled) toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  const handleUpdateRole = async (userId: string, newRole: number, userName: string) => {
    const roleLabel = newRole === 2 ? "นิสิต" : "ผู้ใช้ทั่วไป";
    if (
      !window.confirm(
        `คุณต้องการปรับระดับผู้ใช้ ${userName || userId} เป็น "${roleLabel}" ใช่หรือไม่?`
      )
    ) {
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role_flg: newRole } : u))
      );
      toast.success(`ปรับระดับผู้ใช้เป็น "${roleLabel}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "ปรับระดับผู้ใช้ไม่สำเร็จ");
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.warning("กรุณาเลือกผู้ใช้");
      return;
    }

    const targetUser = availableUsers.find((u) => u.user_id === selectedUserId);

    try {
      await addClassUser(selectedClassId, selectedUserId);

      if (targetUser && targetUser.role_flg === 3 && autoPromote) {
        try {
          await updateUserRole(selectedUserId, 2);
        } catch (roleErr) {
          console.error("Auto promote error:", roleErr);
        }
      }

      toast.success("เพิ่มผู้ใช้เข้าสู่รายวิชาเรียบร้อย");

      const [classUsers, available] = await Promise.all([
        fetchClassUsers(selectedClassId),
        fetchAvailableUsers(selectedClassId),
      ]);

      setUsers(classUsers.filter((u) => u.view_flg === 0));
      setAvailableUsers(available);
      setSelectedUserId("");
    } catch {
      toast.error("เพิ่มผู้ใช้ไม่สำเร็จ");
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!window.confirm(`คุณต้องการลบผู้ใช้ ${userName || userId} ออกจากรายวิชานี้?`)) return;

    try {
      await removeClassUser(selectedClassId, userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));

      const available = await fetchAvailableUsers(selectedClassId);
      setAvailableUsers(available);

      toast.success("ลบผู้ใช้ออกจากรายวิชาเรียบร้อย");
    } catch (err) {
      console.error(err);
      toast.error("ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  const selectedClassObj = classes.find((c) => c.class_id === selectedClassId);

  return (
    <div className="class-user-page">
      <div className="class-user-header">
        <div className="title-group">
          <div className="title-icon-box">
            <FiUsers size={24} />
          </div>
          <div>
            <h2 className="page-title">จัดการผู้ใช้งานในรายวิชา</h2>
            <p className="page-subtitle">
              กำหนดรายชื่อนิสิตและผู้ใช้งานที่ลงทะเบียนในแต่ละรายวิชา
            </p>
          </div>
        </div>
      </div>

      <div className="course-picker-card">
        <div className="course-select-wrapper">
          <label>
            <FiBookOpen size={16} /> เลือกรายวิชาที่ต้องการจัดการ :
          </label>
          <select
            className="course-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option key="class-placeholder" value="">
              -- กรุณาเลือกรายวิชา --
            </option>

            {classes.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_id} — {c.class_name}
              </option>
            ))}
          </select>
        </div>

        {selectedClassObj && (
          <div className="selected-course-info">
            <span className="info-badge">
              <FiCheckCircle size={14} /> รายวิชาที่เลือก: {selectedClassObj.class_id} ({selectedClassObj.class_name})
            </span>
          </div>
        )}
      </div>

      {!selectedClassId && (
        <div className="empty-state-picker">
          <FiBookOpen size={48} className="empty-icon" />
          <h3>กรุณาเลือกรายวิชา</h3>
          <p>เลือกรายวิชาจากเมนูด้านบนเพื่อดูรายชื่อสมาชิกและเพิ่มผู้ใช้ใหม่</p>
        </div>
      )}

      {selectedClassId && (
        <div className="class-user-content-card">
          <div className="add-user-section">
            <h4 className="section-heading">เพิ่มผู้ใช้เข้ารายวิชา</h4>
            <div className="add-user-box">
              <div className="user-dropdown-wrapper">
                <FiUser className="dropdown-icon" size={16} />
                <select
                  className="user-dropdown"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- เลือกผู้ใช้ที่ต้องการเพิ่ม --</option>

                  {availableUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.user_name} ({u.user_id}) {u.role_flg === 3 ? "— [ผู้ใช้ทั่วไป]" : "— [นิสิต]"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn-add-user"
                onClick={handleAddUser}
                disabled={!selectedUserId}
              >
                <FiUserPlus size={16} /> เพิ่มเข้ารายวิชา
              </button>
            </div>

            {availableUsers.find((u) => u.user_id === selectedUserId)?.role_flg === 3 && (
              <div className="auto-promote-banner">
                <label className="auto-promote-checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoPromote}
                    onChange={(e) => setAutoPromote(e.target.checked)}
                  />
                  <span>ปรับระดับจาก <strong>"ผู้ใช้ทั่วไป"</strong> เป็น <strong>"นิสิต"</strong> ทันทีเมื่อเพิ่มเข้ารายวิชา</span>
                </label>
              </div>
            )}
          </div>

          <div className="members-section">
            <div className="members-header">
              <h4 className="section-heading">
                รายชื่อสมาชิกในรายวิชา ({users.length} คน)
              </h4>
            </div>

            {loading ? (
              <div className="table-loading">กำลังโหลดรายชื่อผู้ใช้...</div>
            ) : (
              <div className="table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>รหัสผู้ใช้</th>
                      <th>ชื่อผู้ใช้</th>
                      <th>บทบาท (Role)</th>
                      <th>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const roleMeta = ROLE_TEXT[u.role_flg] || {
                        text: "ผู้ใช้งาน",
                        chipClass: "role-chip-guest",
                      };

                      return (
                        <tr key={u.user_id}>
                          <td className="user-id-col">{u.user_id}</td>
                          <td>
                            <div className="user-cell-name">
                              <div className="user-cell-avatar">
                                {u.user_name ? u.user_name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <span>{u.user_name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="member-role-cell">
                              <span className={`member-role-chip ${roleMeta.chipClass}`}>
                                {roleMeta.text}
                              </span>

                              {u.role_flg === 3 && (
                                <button
                                  type="button"
                                  className="btn-promote-role"
                                  onClick={() => handleUpdateRole(u.user_id, 2, u.user_name)}
                                  title="ปรับระดับผู้ใช้จาก 'ผู้ใช้ทั่วไป' เป็น 'นิสิต'"
                                >
                                  <FiUserCheck size={13} /> ปรับเป็นนิสิต
                                </button>
                              )}

                              {u.role_flg === 2 && (
                                <button
                                  type="button"
                                  className="btn-demote-role"
                                  onClick={() => handleUpdateRole(u.user_id, 3, u.user_name)}
                                  title="ปรับระดับกลับเป็น 'ผู้ใช้ทั่วไป'"
                                >
                                  <FiRotateCcw size={11} /> ปรับเป็นทั่วไป
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {u.role_flg === 0 ? (
                              <span
                                className="protected-admin-chip"
                                title="ผู้ดูแลระบบ (ไม่สามารถลบออกจากรายวิชาได้)"
                              >
                                <FiShield size={13} /> ไม่สามารถลบได้
                              </span>
                            ) : (
                              <button
                                className="btn-remove-member"
                                onClick={() => handleRemoveUser(u.user_id, u.user_name)}
                                title="ลบออกจากรายวิชา"
                              >
                                <FiTrash2 size={15} /> ลบออก
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="no-member-row">
                          <FiUsers size={36} style={{ color: "var(--up-purple-soft)", marginBottom: 8 }} />
                          <div>ยังไม่มีผู้ใช้ในรายวิชานี้</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassUserManagement;


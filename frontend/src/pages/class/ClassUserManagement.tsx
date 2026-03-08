import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchClasses,
  fetchClassUsers,
  addClassUser,
  removeClassUser,
  type Class,
  type ClassUser,
} from "../../services/classUser.service";
import { fetchAvailableUsers, type User } from "../../services/user.service";
import "../../css/classes/ClassUserManagement.css";

const ROLE_TEXT: Record<number, string> = {
  0: "ผู้ดูแลระบบ",
  1: "อาจารย์",
  2: "นักศึกษา",
  3: "บุคคลทั่วไป",
};

function ClassUserManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [users, setUsers] = useState<ClassUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

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

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.warning("กรุณาเลือกผู้ใช้");
      return;
    }

    try {
      await addClassUser(selectedClassId, selectedUserId);
      toast.success("เพิ่มผู้ใช้เรียบร้อย");

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

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeClassUser(selectedClassId, userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success("ลบผู้ใช้เรียบร้อย");
    } catch (err) {
      console.error(err);
      toast.error("ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  return (
    <div className="class-user-page">
      <h2>จัดการผู้ใช้งานในรายวิชา</h2>

      <div className="course-select-wrapper">
        <label>รายวิชา</label>
        <select
          className="course-select"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option key="class-placeholder" value="">
            📘 เลือกรายวิชา
          </option>

          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.class_id} — {c.class_name}
            </option>
          ))}
        </select>
      </div>

      {!selectedClassId && (
        <div className="empty-state">กรุณาเลือกรายวิชาเพื่อดูรายชื่อผู้ใช้</div>
      )}

      {selectedClassId && (
        <>
          <div className="add-user-box">
            <select
              className="user-dropdown"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="" disabled>
                ➕ เลือกผู้ใช้
              </option>

              {availableUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.user_name} — {u.user_id}
                </option>
              ))}
            </select>

            <button
              className="btn primary"
              onClick={handleAddUser}
              disabled={!selectedUserId}
            >
              เพิ่มผู้ใช้
            </button>
          </div>

          {loading ? (
            <div className="loading">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>รหัสผู้ใช้</th>
                    <th>ชื่อผู้ใช้</th>
                    <th>บทบาท</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.user_id}</td>
                      <td>{u.user_name}</td>
                      <td>{ROLE_TEXT[u.role_flg]}</td>
                      <td>
                        <button
                          className="btn danger"
                          onClick={() => handleRemoveUser(u.user_id)}
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        ไม่พบข้อมูลผู้ใช้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ClassUserManagement;

import { useEffect, useState, useRef } from "react";
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
  FiSearch,
  FiX,
  FiChevronDown,
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
  const [userSearchText, setUserSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [autoPromote, setAutoPromote] = useState(true);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const rawRole = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const currentRole = token && rawRole !== null && rawRole !== undefined ? Number(rawRole) : null;
  const currentUserId = localStorage.getItem("user_id") || localStorage.getItem("userId");
  const isAdmin = currentRole === 0;

  useEffect(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => toast.error("โหลดรายวิชาไม่สำเร็จ"));
  }, []);

  useEffect(() => {
    setSelectedUserId("");
    setUserSearchText("");
    setIsDropdownOpen(false);
  }, [selectedClassId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  const selectedUserObj = availableUsers.find((u) => u.user_id === selectedUserId);

  const filteredUsers = availableUsers.filter((u) => {
    if (!userSearchText.trim()) return true;
    if (
      selectedUserObj &&
      (userSearchText === `${selectedUserObj.user_name} (${selectedUserObj.user_id})` ||
        userSearchText === selectedUserObj.user_name ||
        userSearchText === selectedUserObj.user_id)
    ) {
      return true;
    }
    const term = userSearchText.trim().toLowerCase();
    const nameMatch = (u.user_name || "").toLowerCase().includes(term);
    const idMatch = String(u.user_id || "").toLowerCase().includes(term);
    const combinedMatch = `${u.user_name || ""} ${u.user_id || ""}`.toLowerCase().includes(term);
    return nameMatch || idMatch || combinedMatch;
  });

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.user_id);
    setUserSearchText(`${user.user_name} (${user.user_id})`);
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedUserId("");
    setUserSearchText("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserSearchText(val);
    setIsDropdownOpen(true);
    if (selectedUserId) {
      if (selectedUserObj && val !== `${selectedUserObj.user_name} (${selectedUserObj.user_id})`) {
        setSelectedUserId("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
    } else if (e.key === "Enter") {
      const term = userSearchText.trim().toLowerCase();
      const exactMatch = filteredUsers.find(
        (u) =>
          String(u.user_id).toLowerCase() === term ||
          (u.user_name && u.user_name.toLowerCase() === term)
      );
      if (exactMatch) {
        handleSelectUser(exactMatch);
      } else if (isDropdownOpen && filteredUsers.length === 1) {
        handleSelectUser(filteredUsers[0]);
      }
    }
  };

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
      setUserSearchText("");
      setIsDropdownOpen(false);
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  const selectedClassObj = classes.find((c) => c.class_id === selectedClassId);
  const isCreator = Boolean(
    selectedClassObj?.created_by &&
      currentUserId &&
      String(selectedClassObj.created_by) === String(currentUserId)
  );

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
              <div className="searchable-user-wrapper" ref={searchDropdownRef}>
                <div
                  className={`searchable-input-container ${isDropdownOpen ? "is-focused" : ""} ${
                    selectedUserId ? "has-selected" : ""
                  }`}
                >
                  <FiSearch className="search-input-icon" size={17} />
                  <input
                    type="text"
                    className="searchable-user-input"
                    placeholder="พิมพ์รหัสนิสิต หรือชื่อ เพื่อค้นหาผู้ใช้..."
                    value={userSearchText}
                    onChange={handleSearchChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                  />
                  {userSearchText && (
                    <button
                      type="button"
                      className="btn-clear-user-search"
                      onClick={handleClearSelection}
                      title="ล้างการเลือก"
                    >
                      <FiX size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-toggle-user-dropdown"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    title={isDropdownOpen ? "ปิดรายการ" : "เปิดรายการทั้งหมด"}
                  >
                    <FiChevronDown
                      size={17}
                      className={`dropdown-chevron ${isDropdownOpen ? "rotated" : ""}`}
                    />
                  </button>
                </div>

                {isDropdownOpen && (
                  <div className="searchable-user-menu">
                    <div className="user-menu-header">
                      <span>
                        {userSearchText.trim() && !selectedUserObj
                          ? `ผลการค้นหา (${filteredUsers.length} คน)`
                          : `รายชื่อผู้ใช้ที่สามารถเพิ่มได้ (${availableUsers.length} คน)`}
                      </span>
                      {selectedUserId && (
                        <span className="selected-indicator">เลือกผู้ใช้แล้ว</span>
                      )}
                    </div>

                    <div className="user-menu-options-list">
                      {availableUsers.length === 0 ? (
                        <div className="user-menu-empty">
                          <FiUser className="empty-menu-icon" size={24} />
                          <p>ไม่มีผู้ใช้ที่สามารถเพิ่มได้</p>
                          <span className="empty-sub">ผู้ใช้ทุกคนในระบบได้เข้าร่วมรายวิชานี้แล้ว</span>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="user-menu-empty">
                          <FiSearch className="empty-menu-icon" size={24} />
                          <p>ไม่พบข้อมูลผู้ใช้ที่ตรงกับ "{userSearchText}"</p>
                          <span className="empty-sub">ลองค้นหาด้วยรหัสนิสิต (เช่น 65..., 66...) หรือชื่อ</span>
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelected = u.user_id === selectedUserId;
                          return (
                            <div
                              key={u.user_id}
                              className={`user-menu-option-item ${isSelected ? "selected" : ""}`}
                              onClick={() => handleSelectUser(u)}
                            >
                              <div className="option-avatar">
                                {u.user_name ? u.user_name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="option-info">
                                <div className="option-name-row">
                                  <span className="option-user-name">{u.user_name}</span>
                                  <span className="option-user-id">รหัส: {u.user_id}</span>
                                </div>
                              </div>
                              <div className="option-badge-col">
                                <span
                                  className={`option-role-tag ${
                                    u.role_flg === 3 ? "role-guest" : "role-student"
                                  }`}
                                >
                                  {u.role_flg === 3 ? "ผู้ใช้ทั่วไป" : "นิสิต"}
                                </span>
                                {isSelected && (
                                  <span className="option-check-icon">
                                    <FiCheckCircle size={15} />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
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
                            ) : Boolean(u.is_creator) || (selectedClassObj?.created_by && String(u.user_id) === String(selectedClassObj.created_by)) ? (
                              <span
                                className="protected-admin-chip"
                                title="อาจารย์เจ้าของรายวิชา (ไม่สามารถลบออกจากรายวิชาได้)"
                              >
                                <FiShield size={13} /> เจ้าของรายวิชา
                              </span>
                            ) : !isAdmin && !isCreator && u.role_flg === 1 && String(u.user_id) !== String(currentUserId) ? (
                              <span
                                className="protected-admin-chip"
                                title="อาจารย์ผู้ร่วมสอน (ไม่สามารถลบออกจากรายวิชาได้)"
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


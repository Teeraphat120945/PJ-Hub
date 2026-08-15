import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit,
  FiArrowLeft,
  FiBookOpen,
  FiFileText,
  FiTag,
  FiUploadCloud,
  FiLink,
  FiCheck,
  FiX,
  FiFile,
} from "react-icons/fi";
import {
  getAssignmentDetail,
  updateAssignment,
  type Assignment,
} from "../../services/assignment.service";
import "../../css/assignments/AssignmentEdit.css";
import { toast } from "react-toastify";

const WORK_TYPES = [
  "Web",
  "Application",
  "Web Application",
  "IOT",
  "Document",
  "Other",
];

function AssignmentEdit() {
  const { assignment_id } = useParams<{ assignment_id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!assignment_id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getAssignmentDetail(assignment_id);

        setAssignment({
          ...res,
          files: Array.isArray(res.files) ? res.files : [],
        });
      } catch (err) {
        console.error("โหลดข้อมูลผลงานไม่สำเร็จ", err);
        setAssignment(null);
        toast.error("โหลดข้อมูลผลงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignment_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    if (!assignment.assignment_name.trim()) {
      toast.error("กรุณากรอกชื่อผลงาน");
      return;
    }

    try {
      setSaving(true);
      await updateAssignment(assignment.assignment_id, {
        ...assignment,
        newFiles,
        deletedFileIds,
      });

      toast.success("แก้ไขผลงานสำเร็จ");
      navigate(`/assignment/${assignment.assignment_id}`);
    } catch (err) {
      console.error(err);
      toast.error("แก้ไขผลงานไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="assignment-edit-page">
        <div className="assignment-edit-card">
          <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            กำลังโหลดข้อมูลผลงาน...
          </p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="assignment-edit-page">
        <div className="assignment-edit-card">
          <h3>ไม่พบข้อมูลผลงาน</h3>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <FiArrowLeft /> ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  const MAX_LENGTH = 500;
  const currentDetail = assignment.assignment_detail || "";
  const remaining: number = MAX_LENGTH - currentDetail.length;

  return (
    <div className="assignment-edit-page">
      <div className="assignment-edit-card">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft /> กลับ
        </button>

        <div className="form-card-header">
          <div className="form-icon-box">
            <FiEdit size={26} />
          </div>
          <h2>แก้ไขผลงาน</h2>
          <p className="form-subtitle">แก้ไขข้อมูล อัปโหลดไฟล์ หรือเปลี่ยนหมวดหมู่ของผลงาน</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field grid-6">
              <label>
                <FiBookOpen size={15} /> รหัสรายวิชา
              </label>
              <div className="readonly-box code-box">{assignment.class_id}</div>
            </div>

            <div className="field grid-6">
              <label>
                <FiFileText size={15} /> ชื่อผลงาน <span className="required-star">*</span>
              </label>
              <input
                value={assignment.assignment_name}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    assignment_name: e.target.value,
                  })
                }
                placeholder="กรอกชื่อผลงาน..."
                required
              />
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">
              <FiTag size={15} /> ประเภทผลงาน
            </label>
            <div className="create-tag-grid">
              {WORK_TYPES.map((tag) => {
                const active = assignment.assignment_type === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`create-tag-item-btn ${active ? "active" : ""}`}
                    onClick={() =>
                      setAssignment({
                        ...assignment,
                        assignment_type: tag,
                      })
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">รายละเอียดผลงาน</label>
            <div className="textarea-wrapper">
              <textarea
                maxLength={MAX_LENGTH}
                value={assignment.assignment_detail || ""}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    assignment_detail: e.target.value,
                  })
                }
                placeholder="อธิบายรายละเอียด แนวคิด หรือวิธีการใช้งานผลงาน..."
              />
              <span className={`char-count ${remaining < 50 ? "near-limit" : ""}`}>
                เหลือ {remaining} / {MAX_LENGTH} ตัวอักษร
              </span>
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">จัดการไฟล์และลิงก์ผลงาน</label>
            <div className="form-grid">
              <div className="field grid-6">
                <label className="sub-label">
                  <FiUploadCloud size={15} /> แนบไฟล์เพิ่มเติม
                </label>

                <label
                  className="file-upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileChange}
                  />
                  <FiUploadCloud size={24} className="upload-icon" />
                  <span>คลิกเพื่อเพิ่มไฟล์ใหม่</span>
                </label>

                {newFiles.length > 0 && (
                  <div className="files-group">
                    <span className="group-label">ไฟล์ใหม่ที่เลือก:</span>
                    <ul className="file-list">
                      {newFiles.map((file, i) => (
                        <li key={i} className="file-item new-file">
                          <FiFile size={16} className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() =>
                              setNewFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            title="ลบไฟล์"
                          >
                            <FiX size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {assignment.files.length > 0 && (
                  <div className="files-group">
                    <span className="group-label">ไฟล์เดิมในระบบ:</span>
                    <ul className="file-list">
                      {assignment.files.map((file) => (
                        <li key={file.id} className="file-item">
                          <FiFile size={16} className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => {
                              if (file.id == null) return;
                              setDeletedFileIds((prev) => [...prev, file.id]);
                              setAssignment((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      files: prev.files.filter(
                                        (f) => f.id !== file.id,
                                      ),
                                    }
                                  : prev,
                              );
                            }}
                            title="ลบไฟล์นี้ออกจากระบบ"
                          >
                            <FiX size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="field grid-6">
                <label className="sub-label">
                  <FiLink size={15} /> ลิงก์ผลงานภายนอก
                </label>
                <input
                  type="url"
                  value={assignment.assignment_link || ""}
                  onChange={(e) =>
                    setAssignment({
                      ...assignment,
                      assignment_link: e.target.value,
                    })
                  }
                  placeholder="https://github.com/your-username/repo"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              <FiX size={18} /> ยกเลิก
            </button>

            <button type="submit" className="primary-btn" disabled={saving}>
              <FiCheck size={18} />
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentEdit;


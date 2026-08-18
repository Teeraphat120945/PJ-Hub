import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlusSquare,
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
import { getClassesByUser } from "../../services/class.service";
import { createAssignment } from "../../services/assignment.service";
import "../../css/assignments/CreateAssignment.css";

type ClassItem = {
  class_id: string;
  class_name: string;
};

const WORK_TYPES = [
  "Web",
  "Application",
  "Web Application",
  "IOT",
  "Document",
  "Other",
];

const CreateAssignment = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [workType, setWorkType] = useState("Web");
  const [loading, setLoading] = useState(false);
  const MAX_LENGTH = 500;

  const remaining: number = MAX_LENGTH - detail.length;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const result = await getClassesByUser();
        setClasses(result);
      } catch (err) {
        console.error(err);
        toast.error("โหลดรายวิชาไม่สำเร็จ");
      }
    };

    fetchClasses();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass) {
      toast.error("กรุณาเลือกรายวิชา");
      return;
    }

    if (!title.trim()) {
      toast.error("กรุณากรอกชื่อผลงาน");
      return;
    }

    try {
      setLoading(true);

      await createAssignment({
        class_id: selectedClass,
        title: title.trim(),
        detail: detail.trim(),
        link: link.trim(),
        work_type: workType,
        files,
      });

      toast.success("สร้างผลงานสำเร็จ");
      navigate(`/class/${selectedClass}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "อัปโหลดผลงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-assignment-page">
      <div className="create-assignment-card">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft /> กลับ
        </button>

        <div className="form-card-header">
          <div className="form-icon-box">
            <FiPlusSquare size={26} />
          </div>
          <h2>สร้างผลงานใหม่</h2>
          <p className="form-subtitle">กรอกรายละเอียดและอัปโหลดไฟล์ผลงานสำหรับรายวิชา</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field grid-6">
              <label>
                <FiBookOpen size={15} /> รายวิชา <span className="required-star">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">-- เลือกรายวิชา --</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_id} : {c.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field grid-6">
              <label>
                <FiFileText size={15} /> ชื่อผลงาน <span className="required-star">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น Web Application Final Project"
                required
              />
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">
              <FiTag size={15} /> ประเภทผลงาน
            </label>
            <div className="create-tag-grid">
              {WORK_TYPES.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`create-tag-item-btn ${workType === tag ? "active" : ""}`}
                  onClick={() => setWorkType(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">รายละเอียดผลงาน</label>
            <div className="textarea-wrapper">
              <textarea
                maxLength={MAX_LENGTH}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="อธิบายรายละเอียด แนวคิด หรือวิธีการใช้งานผลงาน..."
              />
              <span className={`char-count ${remaining < 50 ? "near-limit" : ""}`}>
                เหลือ {remaining} / {MAX_LENGTH} ตัวอักษร
              </span>
            </div>
          </div>

          <div className="field form-section">
            <label className="section-title">แนบไฟล์และลิงก์ผลงาน</label>
            <div className="form-grid">
              <div className="field grid-6">
                <label className="sub-label">
                  <FiUploadCloud size={15} /> แนบไฟล์ประกอบ
                </label>

                <label className="file-upload-zone">
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileChange}
                  />
                  <FiUploadCloud size={24} className="upload-icon" />
                  <span>คลิกเพื่อเลือกไฟล์ (อัปโหลดได้หลายไฟล์)</span>
                </label>

                {files.length > 0 && (
                  <ul className="file-list">
                    {files.map((file, index) => (
                      <li key={index} className="file-item">
                        <FiFile size={16} className="file-icon" />
                        <span className="file-name">{file.name}</span>
                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={() => handleRemoveFile(index)}
                          title="ลบไฟล์"
                        >
                          <FiX size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="field grid-6">
                <label className="sub-label">
                  <FiLink size={15} /> แนบลิงก์ (GitHub / Demo / Google Drive)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
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
              ยกเลิก
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              <FiCheck size={18} />
              {loading ? "กำลังบันทึกผลงาน..." : "สร้างผลงาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;


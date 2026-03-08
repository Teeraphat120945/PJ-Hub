import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getClassesByUser } from "../../services/class.service";
import { createAssignment } from "../../services/assignment.service";
import "../../css/assignments/CreateAssignment.css";

type ClassItem = {
  class_id: string;
  class_name: string;
};

const CreateAssignment = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [workType, setWorkType] = useState("");
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

    if (!selectedClass || !title.trim()) {
      toast.error("กรุณาเลือกวิชา และกรอกชื่อผลงาน");
      return;
    }

    try {
      setLoading(true);

      await createAssignment({
        class_id: selectedClass,
        title,
        detail,
        link,
        work_type: workType,
        files,
      });

      toast.success("สร้างผลงานสำเร็จ");
      navigate(`/class/${selectedClass}`);
    } catch (err) {
      console.error(err);
      toast.error("อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-assignment-page">
      <div className="create-assignment-card">
        <h2>สร้างผลงานใหม่</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field grid-6">
              <label>รายวิชา</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
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
              <label>ชื่อผลงาน</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น Assignment 1"
              />
            </div>
          </div>
          <div className="field">
            <div className="form-section">
              <label className="section-title">ประเภทผลงาน</label>

              <div className="create-tag-grid">
                {[
                  "Web",
                  "Application",
                  "Web Application",
                  "IOT",
                  "Document",
                  "Other",
                ].map((tag) => (
                  <label key={tag} className="create-tag-item">
                    <input
                      type="radio"
                      name="workType"
                      value={tag}
                      checked={workType === tag}
                      onChange={() => setWorkType(tag)}
                      required
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <div className="form-section">
              <label className="section-title">รายละเอียด</label>
                <div className="textarea-wrapper">
                <textarea
                  maxLength={MAX_LENGTH}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="อธิบายรายละเอียดของผลงาน"
                />
                <span className="char-count">
                  {remaining}/{MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title">แนบผลงาน</label>

              <div className="form-grid">
                <div className="field grid-6">
                  <label>แนบไฟล์</label>

                  <label className="file-upload">
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={handleFileChange}
                    />
                    <span>เลือกไฟล์</span>
                  </label>

                  <ul className="file-list">
                    {files.map((file, index) => (
                      <li key={index} className="file-item">
                        <span className="file-name">{file.name}</span>

                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={() => handleRemoveFile(index)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="field grid-6">
                  <label>แนบลิงก์</label>
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://github.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="assignment-actions">
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "กำลังอัปโหลด..." : "สร้างผลงาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;

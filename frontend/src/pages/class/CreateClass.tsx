import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlusSquare, FiBookOpen, FiArrowLeft, FiCheck } from "react-icons/fi";
import { createClass } from "../../services/class.service";
import "../../css/classes/CreateClass.css";

function CreateClass() {
  const [classId, setClassId] = useState("");
  const [className, setClassName] = useState("");
  const [describe, setDescribe] = useState("");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const MAX_LENGTH = 500;
  const remaining: number = MAX_LENGTH - describe.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId.trim() || !className.trim()) {
      toast.error("กรุณากรอก รหัสรายวิชา และ ชื่อวิชา");
      return;
    }

    try {
      setLoading(true);
      await createClass(classId.trim(), className.trim(), describe.trim());

      toast.success(`สร้างรายวิชา ${className} สำเร็จ`);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("สร้างรายวิชาไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-class-page">
      <div className="create-class-card">
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
          <h2>สร้างรายวิชาใหม่</h2>
          <p className="form-subtitle">กรอกข้อมูลรายวิชาเพื่อเปิดพื้นที่การเรียนรู้ในระบบ</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="class_id">
              <FiBookOpen size={15} /> รหัสวิชา <span className="required-star">*</span>
            </label>
            <input
              id="class_id"
              type="text"
              placeholder="เช่น CS101 หรือ WEB202"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="class_name">
              ชื่อรายวิชา <span className="required-star">*</span>
            </label>
            <input
              id="class_name"
              type="text"
              placeholder="เช่น Web Application Development"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="class_describe">คำอธิบายรายวิชา</label>
            <div className="textarea-wrapper">
              <textarea
                id="class_describe"
                maxLength={MAX_LENGTH}
                placeholder="ระบุรายละเอียด วัตถุประสงค์ หรือเนื้อหาของรายวิชาโดยย่อ..."
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
              />
              <span className={`char-count ${remaining < 50 ? "near-limit" : ""}`}>
                เหลือ {remaining} / {MAX_LENGTH} ตัวอักษร
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/")}
            >
              ยกเลิก
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              <FiCheck size={18} />
              {loading ? "กำลังสร้างรายวิชา..." : "สร้างรายวิชา"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClass;


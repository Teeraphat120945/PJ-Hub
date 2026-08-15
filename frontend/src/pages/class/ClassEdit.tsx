import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiEdit, FiBookOpen, FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { fetchClassDetail, updateClass } from "../../services/class.service";
import "../../css/classes/ClassEdit.css";
import { toast } from "react-toastify";

const ClassEdit = () => {
  const { class_id } = useParams<{ class_id: string }>();
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [describe, setDescribe] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const MAX_LENGTH = 500;
  const remaining: number = MAX_LENGTH - describe.length;

  useEffect(() => {
    if (!class_id) return;

    const loadDetail = async () => {
      try {
        setPageLoading(true);
        const data = await fetchClassDetail(class_id);
        setClassName(data.class_name);
        setDescribe(data.class_describe || "");
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
      } finally {
        setPageLoading(false);
      }
    };

    loadDetail();
  }, [class_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!class_id) return;

    if (!className.trim()) {
      toast.error("กรุณากรอกชื่อรายวิชา");
      return;
    }

    try {
      setLoading(true);
      await updateClass(class_id, className.trim(), describe.trim());
      toast.success("บันทึกการแก้ไขสำเร็จ");
      navigate(`/class/${class_id}`);
    } catch (err) {
      console.error(err);
      toast.error("แก้ไขรายวิชาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="edit-class-page">
        <div className="edit-class-card">
          <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            กำลังโหลดข้อมูลรายวิชา...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-class-page">
      <div className="edit-class-card">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(`/class/${class_id}`)}
        >
          <FiArrowLeft /> กลับ
        </button>

        <div className="form-card-header">
          <div className="form-icon-box">
            <FiEdit size={26} />
          </div>
          <h2>แก้ไขรายวิชา</h2>
          <p className="form-subtitle">แก้ไขข้อมูลและคำอธิบายของรายวิชา {class_id}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="class_id">
              <FiBookOpen size={15} /> รหัสวิชา (ไม่สามารถแก้ไขได้)
            </label>
            <input
              id="class_id"
              value={class_id}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="field">
            <label htmlFor="class_name">
              ชื่อรายวิชา <span className="required-star">*</span>
            </label>
            <input
              id="class_name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="กรอกชื่อรายวิชา..."
              required
            />
          </div>

          <div className="field">
            <label htmlFor="class_describe">คำอธิบายรายวิชา</label>
            <div className="textarea-wrapper">
              <textarea
                id="class_describe"
                maxLength={MAX_LENGTH}
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
                placeholder="ระบุรายละเอียด วัตถุประสงค์ หรือเนื้อหาของรายวิชาโดยย่อ..."
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
              onClick={() => navigate(`/class/${class_id}`)}
            >
              <FiX size={18} /> ยกเลิก
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              <FiCheck size={18} />
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassEdit;


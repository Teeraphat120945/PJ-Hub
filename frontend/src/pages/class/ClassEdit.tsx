import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchClassDetail, updateClass } from "../../services/class.service";
import "../../css/classes/ClassEdit.css";
import { toast } from "react-toastify";

const ClassEdit = () => {
  const { class_id } = useParams<{ class_id: string }>();
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [describe, setDescribe] = useState("");
  const MAX_LENGTH = 500;


  const remaining: number = MAX_LENGTH - describe.length;
  useEffect(() => {
    if (!class_id) return;

    const loadDetail = async () => {
      try {
        const data = await fetchClassDetail(class_id);
        setClassName(data.class_name);
        setDescribe(data.class_describe || "");
      } catch (err) {
        console.error(err);
      }
    };

    loadDetail();
  }, [class_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!class_id) return;

    try {
      await updateClass(class_id, className, describe);
      toast.success("แก้ไขสำเร็จ");
      navigate(`/class/${class_id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="edit-class-page">
      <div className="edit-class-card">
        <h2>แก้ไขรายวิชา</h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="section-title">รหัสวิชา</label>
            <input value={class_id} onChange={(e) => setClassName(e.target.value)} />
          </div>

          <div className="field">
            <div className="form-section">
            <label className="section-title">ชื่อรายวิชา</label>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
            </div>
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title" >คำอธิบายรายวิชา</label>
                <div className="textarea-wrapper">
                <textarea
                  maxLength={MAX_LENGTH}
                  value={describe}
                  onChange={(e) => setDescribe(e.target.value)}
                />
                <span className="char-count">
                  {remaining}/{MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="edit-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              ยกเลิก
            </button>

            <button type="submit" className="primary-btn">
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassEdit;

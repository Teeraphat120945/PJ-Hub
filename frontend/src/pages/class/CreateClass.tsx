import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createClass } from "../../services/class.service";
import "../../css/classes/CreateClass.css";
import "../../css/index.css";

function CreateClass() {
  const [classId, setClassId] = useState("");
  const [className, setClassName] = useState("");
  const [describe, setDescribe] = useState("");
  //const [types, setTypes] = useState<string[]>([]);

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
      await createClass(classId, className, describe);

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
        <h2>สร้างรายวิชาใหม่</h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="class_id">รหัสวิชา</label>
            <input
              id="class_id"
              type="text"
              placeholder="เช่น WEB101"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title" htmlFor="class_name">
                ชื่อรายวิชา
              </label>
              <input
                id="class_name"
                type="text"
                placeholder="เช่น Web Programming"
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

          <button type="submit" className="primary-btn">
            {loading ? "กำลังสร้างรายวิชา..." : "สร้างรายวิชา"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateClass;

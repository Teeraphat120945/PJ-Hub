import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAssignmentDetail,
  downloadAssignmentFile,
  type Assignment,
} from "../../services/assignment.service";
import "../../css/assignments/AssignmentDetail.css";

const AssignmentDetail = () => {
  const { assignment_id } = useParams<{ assignment_id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!assignment_id) return;

    const fetchData = async () => {
      try {
        const res = await getAssignmentDetail(assignment_id);

        setAssignment({
          ...res,
          files: Array.isArray(res.files) ? res.files : [],
        });
      } catch (error) {
        console.error("โหลดข้อมูลผลงานไม่สำเร็จ", error);
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignment_id]);

  if (loading) {
    return (
      <div className="create-assignment-page">
        <div className="create-assignment-card">
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-required">
        <div className="login-required-card">
          <h2>เข้าสู่ระบบเพื่อดูผลงานเพิ่มเติม</h2>
          <button onClick={() => navigate("/login")}>ไปหน้าเข้าสู่ระบบ</button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="create-assignment-page">
        <div className="create-assignment-card">
          <p>ไม่พบข้อมูลผลงาน</p>
          <button onClick={() => navigate(-1)}>← กลับ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-assignment-page">
      <div className="create-assignment-card">
        <div className="page-header">
          <button className="back-inline-btn" onClick={() => navigate(-1)}>
            ← กลับ
          </button>

          <h2 className="page-title">ผลงาน : {assignment.assignment_name}</h2>

          <div className="header-spacer" />
        </div>

        <div className="form-grid">
          <div className="field grid-6">
            <label>รายวิชา</label>
            <div className="readonly-box">{assignment.class_id}</div>
          </div>

          <div className="field grid-6">
            <label>ชื่อผลงาน</label>
            <div className="readonly-box">{assignment.assignment_name}</div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">ประเภทผลงาน</label>
            <div className="tag-grid readonly">
              {[
                "Web",
                "Application",
                "Web Application",
                "IOT",
                "Document",
                "Other",
              ].map((tag) => (
                <label key={tag} className="tag-item">
                  <span
                    className={assignment.assignment_type === tag ? "active" : ""}
                  >
                    {tag}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">รายละเอียด</label>
            <div className="readonly-box multiline">
              {assignment.assignment_detail || "-"}
            </div>
          </div>
        </div>

        <div className="field">
          <div className="form-section">
            <label className="section-title">แนบผลงาน</label>

            <div className="form-grid">
              <div className="field grid-6">
                <label>แนบไฟล์</label>

                {assignment.files.length > 0 ? (
                  <ul className="file-list">
                    {assignment.files.map((file) => (
                      <li key={file.id} className="file-item">
                        <button
                          type="button"
                          className="file-link"
                          onClick={() => downloadAssignmentFile(file.id!)}
                          title={file.name}
                        >
                          {file.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="readonly-box">ไม่มีไฟล์</div>
                )}
              </div>

              <div className="field grid-6">
                <label>แนบลิงก์</label>
                {assignment.assignment_link ? (
                  <a
                    href={assignment.assignment_link}
                    target="_blank"
                    rel="noreferrer"
                    className="assignment-link"
                  >
                    {assignment.assignment_link}
                  </a>
                ) : (
                  <div className="readonly-box">ไม่มีลิงก์</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;

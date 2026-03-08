import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAssignmentDetail,
  updateAssignment,
  type Assignment,
} from "../../services/assignment.service";
import "../../css/assignments/AssignmentEdit.css";
import { toast } from "react-toastify";

function AssignmentEdit() {
  const { assignment_id } = useParams<{ assignment_id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {

    if (!assignment_id) return;

    const fetchData = async () => {
      try {
        const res = await getAssignmentDetail(assignment_id);


        setAssignment({
          ...res,
          files: Array.isArray(res.files) ? res.files : [],
        });
      } catch (err) {
        console.error("โหลดข้อมูลผลงานไม่สำเร็จ", err);
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignment_id]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    try {
      await updateAssignment(assignment.assignment_id, {
        ...assignment,
        newFiles,
        deletedFileIds,
      });

      toast.success("แก้ไขผลงานสำเร็จ");
    } catch (err) {
      console.error(err);
      toast.error("แก้ไขผลงานไม่สำเร็จ");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (!e.target.files) {
      return;
    }

    const files = Array.from(e.target.files);

    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  if (loading) return <p>กำลังโหลดข้อมูล...</p>;
  if (!assignment) return <p>ไม่พบผลงาน</p>;

  return (
    <div className="create-assignment-page">
      <div className="create-assignment-card">
        <div className="page-header">
          <button
            type="button"
            className="back-inline-btn"
            onClick={() => navigate(-1)}
          >
            ← กลับ
          </button>

          <h2 className="page-title">แก้ไขผลงาน</h2>
          <div className="header-spacer" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field grid-6">
              <label>รายวิชา</label>
              <div className="readonly-box">{assignment.class_id}</div>
            </div>

            <div className="field grid-6">
              <label>ชื่อผลงาน</label>
              <input
                value={assignment.assignment_name}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    assignment_name: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="field">
            <label>ประเภทผลงาน</label>

            <div className="tag-grid">
              {[
                "Web",
                "Application",
                "Web Application",
                "IOT",
                "Document",
                "Other",
              ].map((tag) => {
                const active = assignment.assignment_type === tag;

                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-item-btn ${active ? "active" : ""}`}
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

          <div className="field">
            <label>รายละเอียด</label>
            <textarea
              value={assignment.assignment_detail}
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  assignment_detail: e.target.value,
                })
              }
            />
          </div>

          <div className="form-grid">
            <div className="field grid-6">
              <label>แนบไฟล์</label>

              <label
                className="file-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
                <span>เลือกไฟล์</span>
              </label>

              {newFiles.length > 0 && (
                <ul className="file-list">
                  {newFiles.map((file, i) => (
                    <li key={i} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() =>
                          setNewFiles((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {assignment.files.length > 0 && (
                <ul className="file-list">
                  {assignment.files.map((file) => (
                    <li key={file.id} className="file-item">
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
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="field grid-6">
              <label>แนบลิงก์</label>
              <input
                value={assignment.assignment_link || ""}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    assignment_link: e.target.value,
                  })
                }
                placeholder="https://github.com"
              />
            </div>
          </div>

          <div className="assignment-actions">
            <button type="submit" className="primary-btn">
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentEdit;

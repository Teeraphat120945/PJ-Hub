import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiTag,
  FiDownload,
  FiExternalLink,
  FiMessageSquare,
  FiMoreVertical,
  FiSend,
  FiFile,
  FiLogIn,
  FiEdit,
  FiTrash2,
  FiX,
  FiCheck,
  FiLock,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiAlertTriangle,
  FiLink,
} from "react-icons/fi";
import { formatThaiYear, calculateExpiryInfo } from "../../utils/dateUtils";
import {
  getAssignmentDetail,
  downloadAssignmentFile,
  checkLinkService,
  type Assignment,
  type LinkCheckResult,
} from "../../services/assignment.service";
import {
  addCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
  type Comment,
} from "../../services/comment.service";
import "../../css/assignments/AssignmentDetail.css";
import { toast } from "react-toastify";

const AssignmentDetail = () => {
  const { assignment_id } = useParams<{ assignment_id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role") || localStorage.getItem("role_flg");
  const userRole = role !== null && role !== undefined ? Number(role) : null;

  const isWorkOwner = Boolean(
    assignment?.is_work_owner ??
    (assignment && currentUserId && String(assignment.created_by) === String(currentUserId))
  );

  const isCourseInstructor = Boolean(
    assignment?.is_class_responsible ??
    (userRole === 0 || (assignment && currentUserId && String(assignment.class_created_by) === String(currentUserId)))
  );

  const canComment = Boolean(
    assignment?.can_comment ??
    (isWorkOwner || isCourseInstructor)
  );
  const canEdit = Boolean(
    assignment?.can_edit ??
    (isWorkOwner || isCourseInstructor)
  );
  const isStudentOrStaff = userRole === 0 || userRole === 1 || userRole === 2;
  // ให้สิทธิ์ตาม can_access_resources ที่คำนวณจาก backend หรือ fallback ตาม role
  const canAccessResources = Boolean(
    assignment?.can_access_resources ?? isStudentOrStaff
  );
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [linkCheckResult, setLinkCheckResult] = useState<LinkCheckResult | null>(null);
  const [checkingLink, setCheckingLink] = useState(false);

  const expiryInfo = calculateExpiryInfo(
    assignment?.created_datetime,
    assignment?.retention_days || 365
  );

  const handleCheckLink = async (targetUrl?: string) => {
    const url = targetUrl || assignment?.assignment_link;
    if (!url || !url.trim()) return;
    try {
      setCheckingLink(true);
      const res = await checkLinkService(url);
      setLinkCheckResult(res);
      if (!res.is_healthy) {
        toast.warning(`ตรวจพบปัญหาลิงก์ภายนอก: ${res.message}`);
      }
    } catch (err: any) {
      setLinkCheckResult({
        is_healthy: false,
        status_code: null,
        reason: "network_error",
        message: err.message || "ไม่สามารถเชื่อมต่อไปยังลิงก์เพื่อตรวจสอบได้",
      });
    } finally {
      setCheckingLink(false);
    }
  };

  useEffect(() => {
    if (!assignment_id) return;

    if (!token) {
      setLoading(false);
      return;
    }

    fetchData();
    fetchComments();
  }, [assignment_id, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAssignmentDetail(assignment_id!);

      setAssignment({
        ...res,
        files: Array.isArray(res.files) ? res.files : [],
      });

      // ตรวจสอบสถานะการเข้าถึงลิงก์ผลงานอัตโนมัติหากมีลิงก์แนบ
      if (res.assignment_link && res.assignment_link.trim()) {
        handleCheckLink(res.assignment_link);
      }
    } catch (error) {
      console.error("โหลดข้อมูลผลงานไม่สำเร็จ", error);
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsService(assignment_id!);
      setComments(data);
    } catch (error) {
      console.error("โหลด comment ไม่สำเร็จ", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSendingComment(true);
      const newItem = await addCommentService(assignment_id!, newComment.trim());

      if (!newItem) return;

      setComments((prev) => [newItem, ...prev]);
      setNewComment("");
      toast.success("ส่งความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("ส่งความคิดเห็นไม่สำเร็จ");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (comment_id: number) => {
    if (!window.confirm("คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?")) return;

    try {
      await deleteCommentService(comment_id);
      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
      toast.success("ลบความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("ลบความคิดเห็นไม่สำเร็จ");
    }
  };

  const handleSaveEdit = async (comment_id: number) => {
    if (!editText.trim()) return;

    try {
      await updateCommentService(comment_id, editText.trim());

      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === comment_id
            ? { ...c, comment_text: editText.trim() }
            : c,
        ),
      );

      setEditingId(null);
      setEditText("");
      toast.success("แก้ไขความคิดเห็นเรียบร้อย");
    } catch (error) {
      console.error(error);
      toast.error("แก้ไขความคิดเห็นไม่สำเร็จ");
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    if (downloadingFileId) return;

    try {
      setDownloadingFileId(fileId);
      toast.info(`กำลังเริ่มดาวน์โหลด: ${fileName}`);
      await downloadAssignmentFile(fileId, fileName);
      toast.success(`ดาวน์โหลดไฟล์ ${fileName} สำเร็จ`);
    } catch (error: any) {
      console.error("ดาวน์โหลดไฟล์ไม่สำเร็จ:", error);
      toast.error(error?.message || "ไม่สามารถดาวน์โหลดไฟล์ได้");
    } finally {
      setDownloadingFileId(null);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-wrapper">
        <div className="spinner" />
        <p>กำลังโหลดข้อมูลผลงาน...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-required">
        <div className="login-required-card">
          <div className="auth-logo-badge">UP</div>
          <h2>เข้าสู่ระบบเพื่อดูผลงาน</h2>
          <p>กรุณาเข้าสู่ระบบด้วยบัญชีของคุณเพื่อดูรายละเอียดผลงานและร่วมแสดงความคิดเห็น</p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            <FiLogIn /> ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="detail-loading-wrapper">
        <h3>ไม่พบข้อมูลผลงาน</h3>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft /> ย้อนกลับ
        </button>
      </div>
    );
  }

  return (
    <div className="assignment-detail-layout">
      <div className="assignment-detail-card">
        <div className="detail-page-header">
          <div className="detail-header-left">
            <button className="back-inline-btn" onClick={() => navigate(-1)}>
              <FiArrowLeft /> ย้อนกลับ
            </button>

            <div className="detail-header-title-box">
              <div className="detail-header-tags-row">
                <span className="detail-type-badge">{assignment.assignment_type || "ผลงาน"}</span>
                {assignment.created_datetime && (
                  <span
                    className="detail-year-badge"
                    title={`ปี พ.ศ. ที่จัดทำผลงาน: ${formatThaiYear(assignment.created_datetime)}`}
                  >
                    <FiCalendar size={13} />
                    {formatThaiYear(assignment.created_datetime)}
                  </span>
                )}
              </div>
              <h2 className="detail-page-title">{assignment.assignment_name}</h2>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              className="btn-header-edit"
              onClick={() => navigate(`/edit-assignment/${assignment.assignment_id}/edit`)}
              title="แก้ไขข้อมูลและทรัพยากรผลงาน"
            >
              <FiEdit size={14} /> แก้ไขผลงาน
            </button>
          )}
        </div>

        <div className="form-grid margin-top-20">
          <div className={`field ${assignment.created_datetime ? "grid-4" : "grid-6"}`}>
            <label className="field-label">
              <FiBookOpen size={15} /> รหัสรายวิชา
            </label>
            <div className="readonly-box code-box">{assignment.class_id}</div>
          </div>

          <div className={`field ${assignment.created_datetime ? "grid-4" : "grid-6"}`}>
            <label className="field-label">
              <FiTag size={15} /> ประเภทผลงาน
            </label>
            <div className="readonly-box font-weight-600">
              <span className="type-badge-pill">
                {assignment.assignment_type || "General"}
              </span>
            </div>
          </div>

          {assignment.created_datetime && (
            <div className="field grid-4">
              <label className="field-label">
                <FiCalendar size={15} /> ปีที่จัดทำ (พ.ศ.)
              </label>
              <div className="readonly-box font-weight-600">
                <span className="detail-year-badge">
                  <FiCalendar size={13} />
                  {formatThaiYear(assignment.created_datetime)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="field margin-top-16">
          <label className="field-label">รายละเอียดผลงาน</label>
          <div className="readonly-box multiline">
            {assignment.assignment_detail || "ไม่มีรายละเอียดเพิ่มเติม"}
          </div>
        </div>

        <div className="field margin-top-16">
          <label className="field-label">ไฟล์ประกอบและลิงก์</label>
          <div className="form-grid">
            <div className="field grid-6">
              <div className="resource-header-row">
                <label className="sub-field-label">ไฟล์แนบ ({assignment.files.length})</label>
                <span className="permanent-storage-badge" title="ไฟล์แนบในระบบ UP PJ-Hub ได้รับการจัดเก็บถาวร ไม่มีการลบอัตโนมัติ">
                  <FiShield size={13} /> จัดเก็บถาวร (Permanent)
                </span>
              </div>
              {!canAccessResources ? (
                <div className="resource-locked-box">
                  <div className="locked-icon-box">
                    <FiLock size={16} />
                  </div>
                  <div className="locked-text-content">
                    <span className="locked-title">การดาวน์โหลดไฟล์ถูกจำกัดสิทธิ์</span>
                    <span className="locked-desc">
                      สงวนสิทธิ์การดาวน์โหลดเฉพาะนิสิตในรายวิชาเท่านั้น (กรุณาให้อาจารย์ประจำวิชาปรับระดับเป็นนิสิต)
                    </span>
                  </div>
                </div>
              ) : assignment.files.length > 0 ? (
                <ul className="file-list">
                  {assignment.files.map((file) => {
                    const isDownloading = downloadingFileId === file.id;
                    return (
                      <li
                        key={file.id}
                        className={`file-item ${isDownloading ? "file-item-downloading" : ""}`}
                        onClick={() => handleDownloadFile(file.id!, file.name)}
                        title="คลิกเพื่อดาวน์โหลดไฟล์นี้"
                      >
                        <FiFile size={16} className="file-icon" />
                        <button
                          type="button"
                          className="file-link"
                          disabled={isDownloading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file.id!, file.name);
                          }}
                        >
                          {file.name}
                        </button>
                        <button
                          type="button"
                          className="file-download-action-btn"
                          disabled={isDownloading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file.id!, file.name);
                          }}
                          title="ดาวน์โหลดไฟล์"
                        >
                          {isDownloading ? (
                            <span className="file-spinner" />
                          ) : (
                            <FiDownload size={15} className="download-icon" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="readonly-box empty-box">ไม่มีไฟล์แนบ</div>
              )}
            </div>

            <div className="field grid-6">
              <div className="resource-header-row">
                <label className="sub-field-label">ลิงก์ผลงานภายนอก</label>
                {assignment.assignment_link && (
                  <button
                    type="button"
                    className="btn-check-link-mini"
                    onClick={() => handleCheckLink()}
                    disabled={checkingLink}
                    title="กดเพื่อทดสอบสถานะการเข้าถึงของลิงก์ปลายทาง"
                  >
                    <FiRefreshCw size={11} className={checkingLink ? "spin-icon" : ""} />
                    {checkingLink ? "กำลังตรวจ..." : "ตรวจสถานะลิงก์"}
                  </button>
                )}
              </div>
              {!canAccessResources ? (
                <div className="resource-locked-box">
                  <div className="locked-icon-box">
                    <FiLock size={16} />
                  </div>
                  <div className="locked-text-content">
                    <span className="locked-title">การเข้าถึงลิงก์ถูกจำกัดสิทธิ์</span>
                    <span className="locked-desc">
                      สงวนสิทธิ์การดูลิงก์ผลงานเฉพาะนิสิตและอาจารย์ในรายวิชาเท่านั้น
                    </span>
                  </div>
                </div>
              ) : assignment.assignment_link ? (
                <div className="link-resource-box">
                  <a
                    href={
                      assignment.assignment_link.startsWith("http://") ||
                      assignment.assignment_link.startsWith("https://")
                        ? assignment.assignment_link
                        : `https://${assignment.assignment_link}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="assignment-link-btn"
                  >
                    <FiExternalLink size={16} /> เปิดลิงก์ผลงาน
                  </a>

                  {/* ป้ายแสดงสถานะการเข้าถึงของลิงก์ */}
                  {checkingLink && (
                    <div className="link-status-chip checking">
                      <span className="mini-spinner" />
                      <span>กำลังตรวจเช็คการเข้าถึงลิงก์...</span>
                    </div>
                  )}
                  {!checkingLink && linkCheckResult && (
                    <div className={`link-status-chip ${linkCheckResult.is_healthy ? "healthy" : "error"}`}>
                      {linkCheckResult.is_healthy ? (
                        <>
                          <FiCheckCircle size={14} className="chip-icon-ok" />
                          <span>พร้อมใช้งาน ({linkCheckResult.status_code ? `HTTP ${linkCheckResult.status_code}` : "OK"})</span>
                        </>
                      ) : (
                        <>
                          <FiAlertTriangle size={14} className="chip-icon-err" />
                          <span title={linkCheckResult.message}>
                            ลิงก์มีปัญหา: {linkCheckResult.message}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="readonly-box empty-box">ไม่มีลิงก์ภายนอก</div>
              )}
            </div>
          </div>
        </div>

        {/* แผงข้อมูลการดูแลรักษาและอายุทรัพยากร (เฉพาะเจ้าของผลงานและอาจารย์ผู้รับผิดชอบรายวิชา) */}
        {(isWorkOwner || isCourseInstructor) && expiryInfo && (
          <div className="lifecycle-panel margin-top-20">
            <div className="lifecycle-header">
              <div className="lifecycle-title-group">
                <div className="lifecycle-icon-badge">
                  <FiClock size={22} />
                </div>
                <div>
                  <div className="lifecycle-title-row">
                    <h4 className="lifecycle-title">การดูแลรักษาและรอบอายุทรัพยากร (Maintenance & Resource Lifecycle)</h4>
                    <span className="lifecycle-owner-pill">
                      {isWorkOwner ? "คุณคือเจ้าของผลงาน" : "ผู้ดูแลรายวิชา"}
                    </span>
                  </div>
                  <p className="lifecycle-subtitle">
                    ไฟล์แนบจัดเก็บถาวรตลอดไป พร้อมระบบตรวจเช็คสุขภาพลิงก์ภายนอกและรอบทบทวนคุณภาพประจำปี เพื่อให้ผลงานสมบูรณ์อยู่เสมอ
                  </p>
                </div>
              </div>

              <div className="lifecycle-header-badge">
                <span className={`lifecycle-status-pill ${expiryInfo.badgeClass}`}>
                  <span className="status-dot" />
                  {expiryInfo.statusLabel}
                </span>
              </div>
            </div>

            {/* 🚨 กล่องแจ้งเตือนการบำรุงรักษาเมื่อลิงก์เสีย / เข้าถึงไม่ได้ */}
            {assignment.assignment_link && linkCheckResult && !linkCheckResult.is_healthy && (
              <div className="maintenance-alert-banner">
                <div className="alert-banner-top">
                  <div className="alert-banner-icon-box">
                    <FiAlertTriangle size={24} />
                  </div>
                  <div className="alert-banner-text">
                    <div className="alert-badge-tag">🚨 แจ้งเตือนการบำรุงรักษา (Maintenance Alert)</div>
                    <h4 className="alert-banner-title">
                      ลิงก์ผลงานภายนอกไม่สามารถเข้าถึงได้ตามปกติ
                    </h4>
                    <p className="alert-banner-desc">
                      ระบบตรวจพบปัญหาในการเข้าถึง URL ปลายทาง <strong>"{assignment.assignment_link}"</strong>
                    </p>
                  </div>
                </div>

                <div className="alert-banner-status-box">
                  <div className="alert-status-item">
                    <span className="alert-status-label">สถานะ HTTP:</span>
                    <span className="alert-status-code-pill">
                      {linkCheckResult.status_code ? `HTTP ${linkCheckResult.status_code}` : "เชื่อมต่อล้มเหลว (Connection Error)"}
                    </span>
                  </div>
                  <div className="alert-status-item">
                    <span className="alert-status-label">รายละเอียดปัญหา:</span>
                    <span className="alert-status-msg">{linkCheckResult.message}</span>
                  </div>
                </div>

                <div className="alert-banner-action-buttons">
                  {canEdit && (
                    <button
                      type="button"
                      className="btn-alert-edit"
                      onClick={() => navigate(`/edit-assignment/${assignment.assignment_id}/edit`)}
                    >
                      <FiEdit size={14} /> แก้ไขเพื่อเปลี่ยนลิงก์ผลงาน
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-alert-recheck"
                    disabled={checkingLink}
                    onClick={() => handleCheckLink()}
                  >
                    <FiRefreshCw size={14} className={checkingLink ? "spin-icon" : ""} />
                    {checkingLink ? "กำลังตรวจสอบซ้ำ..." : "ตรวจสอบลิงก์อีกครั้ง"}
                  </button>
                </div>
              </div>
            )}

            {/* 🟢 กล่องยืนยันเมื่อลิงก์พร้อมใช้งานปกติ */}
            {assignment.assignment_link && linkCheckResult && linkCheckResult.is_healthy && (
              <div className="maintenance-healthy-banner">
                <FiCheckCircle size={18} className="healthy-banner-icon" />
                <div className="healthy-banner-text">
                  <strong>ลิงก์ภายนอกพร้อมใช้งานปกติ:</strong> ทดสอบเชื่อมต่อล่าสุดสำเร็จ ({linkCheckResult.status_code ? `HTTP ${linkCheckResult.status_code}` : "HTTP 200 OK"}) ปลายทางเปิดแชร์และเข้าถึงได้
                </div>
                <button
                  type="button"
                  className="btn-healthy-recheck"
                  disabled={checkingLink}
                  onClick={() => handleCheckLink()}
                  title="กดเพื่อทดสอบการเชื่อมต่ออีกครั้ง"
                >
                  <FiRefreshCw size={12} className={checkingLink ? "spin-icon" : ""} />
                  {checkingLink ? "กำลังตรวจ..." : "ตรวจซ้ำ"}
                </button>
              </div>
            )}

            <div className="lifecycle-metrics-grid">
              <div className={`lifecycle-metric-card primary ${expiryInfo.badgeClass}`}>
                <span className="metric-label">
                  <FiClock size={14} /> ระยะเวลาในรอบทบทวน
                </span>
                <span className="metric-value">
                  {expiryInfo.daysRemaining > 0 ? `${expiryInfo.daysRemaining} วัน` : "ครบกำหนดแล้ว"}
                </span>
                <span className="metric-subtext">{expiryInfo.remainingLabel}</span>
              </div>

              <div className="lifecycle-metric-card permanent-card">
                <span className="metric-label">
                  <FiShield size={14} /> สถานะไฟล์แนบ
                </span>
                <span className="metric-value-sm color-success">
                  จัดเก็บถาวร
                </span>
                <span className="metric-subtext">
                  {assignment.files.length > 0
                    ? `ปลอดภัย ${assignment.files.length} ไฟล์ • ไม่มีวันหมดอายุ`
                    : "ไม่มีไฟล์แนบ • หากเพิ่มจะจัดเก็บถาวร"}
                </span>
              </div>

              <div className={`lifecycle-metric-card ${linkCheckResult && !linkCheckResult.is_healthy ? "card-expired" : "link-card"}`}>
                <span className="metric-label">
                  <FiExternalLink size={14} /> สถานะลิงก์ผลงาน
                </span>
                <span className="metric-value-sm">
                  {!assignment.assignment_link
                    ? "ไม่มีลิงก์แนบ"
                    : checkingLink
                    ? "กำลังตรวจเช็ค..."
                    : linkCheckResult?.is_healthy
                    ? "🟢 พร้อมใช้งาน"
                    : "🚨 ตรวจพบปัญหา"}
                </span>
                <span className="metric-subtext">
                  {!assignment.assignment_link
                    ? "สามารถเพิ่ม URL ได้ที่หน้าแก้ไข"
                    : checkingLink
                    ? "ทดสอบเชื่อมต่อปลายทาง..."
                    : linkCheckResult?.is_healthy
                    ? `HTTP ${linkCheckResult.status_code || 200} เปิดสาธารณะ`
                    : `${linkCheckResult?.status_code ? `HTTP ${linkCheckResult.status_code}` : "เชื่อมต่อไม่ผ่าน"} กรุณาแก้ไข`}
                </span>
              </div>

              <div className={`lifecycle-metric-card ${expiryInfo.isExpired ? "card-expired" : expiryInfo.isExpiringSoon ? "card-warning" : ""}`}>
                <span className="metric-label">
                  <FiCalendar size={14} /> วันครบกำหนดรอบดูแล
                </span>
                <span className="metric-value-sm">{expiryInfo.expiryFormatted}</span>
                <span className="metric-subtext">รอบทบทวนคุณภาพประจำปี ({expiryInfo.totalDays} วัน)</span>
              </div>
            </div>

            <div className="lifecycle-progress-box">
              <div className="progress-labels">
                <span className="progress-title">ความคืบหน้ารอบทบทวนคุณภาพประจำปี</span>
                <span className="progress-pct">{expiryInfo.percentElapsed}%</span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${expiryInfo.status}`}
                  style={{ width: `${Math.min(100, expiryInfo.percentElapsed)}%` }}
                />
              </div>
              <div className="progress-footer-text">
                <span>เผยแพร่มาแล้ว {expiryInfo.daysElapsed} วัน (ไฟล์จัดเก็บถาวร)</span>
                <span>
                  {expiryInfo.daysRemaining > 0
                    ? `เหลือเวลาในรอบทบทวนอีก ${expiryInfo.daysRemaining} วัน`
                    : "ถึงรอบการทบทวนความถูกต้องของข้อมูล"}
                </span>
              </div>
            </div>

            <div className="lifecycle-guidance-box">
              <h5 className="guidance-title">
                <FiCheckCircle size={16} /> ข้อมูลการดูแลรักษาทรัพยากรผลงาน (Maintenance Checklist)
              </h5>
              <div className="guidance-grid">
                <div className="guidance-item">
                  <div className="guidance-item-header">
                    <FiShield size={16} className="guidance-icon shield" />
                    <strong>ไฟล์แนบผลงาน (จัดเก็บถาวร - Permanent Storage)</strong>
                    <span className="guidance-badge-permanent">ถาวรตลอดไป</span>
                  </div>
                  <p>
                    {assignment.files.length > 0
                      ? `ไฟล์แนบทั้งหมด (${assignment.files.length} รายการ) ได้รับการจัดเก็บบนระบบ UP PJ-Hub อย่างถาวร ไม่มีการลบอัตโนมัติเมื่อครบกำหนดรอบปี ผู้จัดทำและอาจารย์สามารถดาวน์โหลดได้ตลอดเวลา และสามารถอัปโหลดไฟล์ฉบับปรับปรุงใหม่ได้ทุกเมื่อ`
                      : "ผลงานนี้ยังไม่มีไฟล์แนบ หากต้องการเพิ่มเอกสาร รายงานฉบับสมบูรณ์ หรือโปสเตอร์ สามารถแนบเพิ่มเติมได้ที่หน้าแก้ไขผลงาน โดยไฟล์ที่อัปโหลดจะถูกจัดเก็บถาวรเช่นกัน"}
                  </p>
                </div>

                <div className="guidance-item">
                  <div className="guidance-item-header">
                    <FiLink size={16} className="guidance-icon link" />
                    <strong>ลิงก์ผลงานภายนอก (ระบบตรวจสอบอัตโนมัติ)</strong>
                    {assignment.assignment_link && (
                      <span className={`guidance-link-status ${linkCheckResult?.is_healthy ? "healthy" : linkCheckResult ? "error" : "checking"}`}>
                        {checkingLink ? "กำลังตรวจ..." : linkCheckResult?.is_healthy ? "ออนไลน์ปกติ" : linkCheckResult ? "ต้องแก้ไข" : "รอตรวจสอบ"}
                      </span>
                    )}
                  </div>
                  <p>
                    {assignment.assignment_link
                      ? "ระบบตรวจเช็คความพร้อมใช้งานของ URL อัตโนมัติ (HTTP 200, 403 สิทธิ์ส่วนตัว, 404 ลิงก์ถูกลบ) หากพบว่าปลายทางไม่สามารถเข้าถึงได้ ระบบจะแจ้งเตือนการบำรุงรักษาในหน้านี้ทันที พร้อมปุ่มสำหรับกดตรวจสอบซ้ำหรือแก้ไขลิงก์ใหม่"
                      : "ผลงานนี้ยังไม่มีลิงก์ภายนอก สามารถเพิ่ม URL ลิงก์ไปยังโค้ดโครงงาน ตัวอย่างการทำงาน หรือวิดีโอสาธิตได้ที่หน้าแก้ไขผลงาน"}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="lifecycle-actions-bar">
                  <button
                    type="button"
                    className="btn-renew-maintenance"
                    onClick={() => navigate(`/edit-assignment/${assignment.assignment_id}/edit`)}
                  >
                    <FiRefreshCw size={15} /> แก้ไข / อัปเดตทรัพยากรผลงาน
                  </button>

                  {assignment.assignment_link && (
                    <>
                      <button
                        type="button"
                        className="btn-test-link-action"
                        disabled={checkingLink}
                        onClick={() => handleCheckLink()}
                        title="กดเพื่อทดสอบการเชื่อมต่อของลิงก์อีกครั้ง"
                      >
                        <FiRefreshCw size={14} className={checkingLink ? "spin-icon" : ""} />
                        {checkingLink ? "กำลังตรวจสอบลิงก์..." : "ตรวจสอบสถานะลิงก์ทันที"}
                      </button>

                      <a
                        href={
                          assignment.assignment_link.startsWith("http://") ||
                          assignment.assignment_link.startsWith("https://")
                            ? assignment.assignment_link
                            : `https://${assignment.assignment_link}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="btn-test-link"
                      >
                        <FiExternalLink size={15} /> เปิดทดสอบในแท็บใหม่
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="comment-panel">
        <div className="comment-panel-header">
          <FiMessageSquare size={20} className="comment-icon-head" />
          <h3>ความคิดเห็น ({comments.length})</h3>
        </div>

        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="no-comment-box">
              <FiMessageSquare size={36} className="no-comment-icon" />
              <p>ยังไม่มีความคิดเห็น</p>
              <span>เป็นคนแรกที่แสดงความคิดเห็นเกี่ยวกับผลงานนี้</span>
            </div>
          ) : (
            comments.map((c) => {
              const isCommentAuthor = String(c.user_id) === String(currentUserId);
              const canEdit = isCommentAuthor || Number(role) === 0;
              const canDelete = isCommentAuthor || isCourseInstructor || Number(role) === 0;
              const hasMenu = canEdit || canDelete;

              return (
                <div key={c.comment_id} className="comment-item">
                  <div className="comment-top">
                    <div className="comment-header">
                      <div className="comment-user-avatar">
                        {c.user_name ? c.user_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="comment-user-info">
                        <span className="comment-user">{c.user_name}</span>
                        <span className="comment-time">
                          {new Date(c.created_datetime).toLocaleString("th-TH")}
                        </span>
                      </div>
                    </div>

                    {hasMenu && (
                      <div className="comment-menu">
                        <button className="gear-btn" title="ตัวเลือก">
                          <FiMoreVertical size={16} />
                        </button>
                        <div className="menu-dropdown">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingId(c.comment_id);
                                setEditText(c.comment_text);
                              }}
                            >
                              <FiEdit size={13} /> แก้ไข
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteComment(c.comment_id)}
                            >
                              <FiTrash2 size={13} /> ลบ
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="comment-message">
                    {editingId === c.comment_id ? (
                      <div className="edit-comment-wrapper">
                        <textarea
                          className="comment-edit-box"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="comment-edit-action">
                          <button
                            className="btn-cancel-edit"
                            onClick={() => setEditingId(null)}
                          >
                            <FiX size={14} /> ยกเลิก
                          </button>
                          <button
                            className="save-edit-btn"
                            onClick={() => handleSaveEdit(c.comment_id)}
                          >
                            <FiCheck size={14} /> บันทึก
                          </button>
                        </div>
                      </div>
                    ) : (
                      c.comment_text
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canComment ? (
          <div className="comment-input-area">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={150}
              placeholder={
                isCourseInstructor && !isWorkOwner
                  ? "พิมพ์ข้อเสนอแนะหรือความคิดเห็นจากผู้สอน..."
                  : "พิมพ์ความคิดเห็นหรือตอบกลับที่นี่..."
              }
            />
            <div className="comment-input-footer">
              <span className="char-count">{newComment.length} / 150 ตัวอักษร</span>
              <button
                className="btn-send-comment"
                onClick={handleAddComment}
                disabled={sendingComment || !newComment.trim()}
              >
                <FiSend size={15} /> {sendingComment ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-restricted-notice">
            <div className="notice-icon-box">
              <FiLock size={18} />
            </div>
            <div className="notice-content">
              <p className="notice-title">การสนทนาเฉพาะผู้สอนและเจ้าของผลงาน</p>
              <p className="notice-desc">
                คุณสามารถอ่านความคิดเห็นและข้อเสนอแนะได้ แต่การส่งและตอบกลับความคิดเห็นสงวนสิทธิ์เฉพาะอาจารย์ผู้สอนประจำวิชาและเจ้าของผลงานเท่านั้น
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiCheckCircle,
  FiShield,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiUserCheck,
} from "react-icons/fi";
import {
  requestPasswordResetApi,
  verifyResetOtpApi,
  resetPasswordApi,
  changePasswordApi,
} from "../services/auth.service";
import {
  validatePassword,
  validateConfirmPassword,
  getPasswordStrength,
  getPasswordRequirements,
} from "../utils/validation";
import "../css/Login.css";

type TabMode = "forgot" | "change";
type ForgotStep = 1 | 2 | 3 | 4;

function ForgotPassword() {
  const navigate = useNavigate();

  // Active Tab
  const [tabMode, setTabMode] = useState<TabMode>("forgot");

  // ─── State for Forgot Password flow (Tabs 1) ─────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>(1);
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── State for Direct Change Password flow (Tab 2) ───────────
  const [changeIdentifier, setChangeIdentifier] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showChangeNewPassword, setShowChangeNewPassword] = useState(false);
  const [showChangeConfirmPassword, setShowChangeConfirmPassword] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Validation Helpers for New Passwords ────────────────────
  const newPassReq = getPasswordRequirements(
    tabMode === "forgot" ? newPassword : changeNewPassword
  );
  const newPassStrength = getPasswordStrength(
    tabMode === "forgot" ? newPassword : changeNewPassword
  );

  // ─── Step 1: Request OTP ─────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError("กรุณากรอกอีเมล หรือ ชื่อผู้ใช้งาน");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetApi(cleanId);
      setResetToken(res.resetToken);
      setMaskedEmail(res.maskedEmail);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      setForgotStep(2);
      toast.success(res.message || "สร้างรหัสยืนยัน OTP เรียบร้อยแล้ว");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError("รหัส OTP ต้องเป็นตัวเลข 6 หลัก");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtpApi(resetToken, cleanOtp);
      setVerifiedToken(res.verifiedToken);
      setForgotStep(3);
      toast.success("ยืนยันรหัส OTP สำเร็จ กรุณาตั้งรหัสผ่านใหม่");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset to New Password ───────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const pRes = validatePassword(newPassword);
    const cRes = validateConfirmPassword(newPassword, confirmPassword);

    if (!pRes.valid) {
      setError(pRes.message);
      return;
    }
    if (!cRes.valid) {
      setError(cRes.message);
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(verifiedToken, newPassword);
      setForgotStep(4);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถรีเซ็ตรหัสผ่านได้");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Tab 2: Change Password Directly ─────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const cleanId = changeIdentifier.trim();
    if (!cleanId) {
      setError("กรุณากรอกอีเมล หรือ ชื่อผู้ใช้งาน");
      return;
    }

    if (!currentPassword) {
      setError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }

    const pRes = validatePassword(changeNewPassword);
    const cRes = validateConfirmPassword(changeNewPassword, changeConfirmPassword);

    if (!pRes.valid) {
      setError(pRes.message);
      return;
    }
    if (!cRes.valid) {
      setError(cRes.message);
      return;
    }

    if (currentPassword === changeNewPassword) {
      setError("รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านปัจจุบัน");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(cleanId, currentPassword, changeNewPassword);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว");
      navigate(`/login?identifier=${encodeURIComponent(cleanId)}&reset=success`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "480px" }}>
        <button
          className="back-btn"
          onClick={() => navigate("/login")}
          title="กลับไปหน้าเข้าสู่ระบบ"
        >
          <FiArrowLeft /> เข้าสู่ระบบ
        </button>

        <div className="auth-brand-header">
          <div className="auth-logo-badge">UP</div>
          <h2>ระบบจัดการรหัสผ่าน</h2>
          <p className="auth-subtitle">ระบบคลังรายวิชาและผลงาน มหาวิทยาลัยพะเยา</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tabMode === "forgot" ? "active" : ""}`}
            onClick={() => {
              setTabMode("forgot");
              setError("");
            }}
          >
            <FiKey size={15} /> ลืมรหัสผ่าน (OTP)
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tabMode === "change" ? "active" : ""}`}
            onClick={() => {
              setTabMode("change");
              setError("");
            }}
          >
            <FiShield size={15} /> เปลี่ยนรหัสผ่านโดยตรง
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        {/* ═══════════════════════════════════════════════════════
            TAB 1: FORGOT PASSWORD FLOW
        ════════════════════════════════════════════════════════ */}
        {tabMode === "forgot" && (
          <>
            {/* Step Progress Bar (1 to 3) */}
            {forgotStep < 4 && (
              <div className="step-progress-bar">
                <div className="step-progress-line">
                  <div
                    className="step-progress-line-fill"
                    style={{
                      width:
                        forgotStep === 1
                          ? "0%"
                          : forgotStep === 2
                          ? "50%"
                          : "100%",
                    }}
                  />
                </div>

                <div
                  className={`step-progress-item ${
                    forgotStep === 1
                      ? "active"
                      : forgotStep > 1
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="step-circle">
                    {forgotStep > 1 ? <FiCheck size={16} /> : "1"}
                  </div>
                  <span className="step-title">ระบุบัญชี</span>
                </div>

                <div
                  className={`step-progress-item ${
                    forgotStep === 2
                      ? "active"
                      : forgotStep > 2
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="step-circle">
                    {forgotStep > 2 ? <FiCheck size={16} /> : "2"}
                  </div>
                  <span className="step-title">ยืนยัน OTP</span>
                </div>

                <div
                  className={`step-progress-item ${
                    forgotStep === 3
                      ? "active"
                      : forgotStep > 3
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="step-circle">
                    {forgotStep > 3 ? <FiCheck size={16} /> : "3"}
                  </div>
                  <span className="step-title">รหัสผ่านใหม่</span>
                </div>
              </div>
            )}

            {/* Step 1: Identifier */}
            {forgotStep === 1 && (
              <form className="auth-form" onSubmit={handleRequestOtp} noValidate>
                <div className="auth-input-group">
                  <label>อีเมล หรือ ชื่อผู้ใช้งาน</label>
                  <div className="auth-input-wrapper">
                    <FiMail className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="กรอกอีเมล หรือ ชื่อผู้ใช้ที่ลงทะเบียน..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <span className="field-hint">
                    ระบบจะตรวจสอบบัญชีและสร้างรหัส OTP ยืนยันตัวตนความปลอดภัย
                  </span>
                </div>

                <button
                  className="login-primary-btn"
                  type="submit"
                  disabled={loading}
                >
                  <FiKey size={18} />
                  {loading ? "กำลังค้นหาบัญชี..." : "ขอรหัสยืนยัน OTP"}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {forgotStep === 2 && (
              <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
                {/* Developer Simulator Notice if demoOtp present */}
                {demoOtp && (
                  <div className="demo-otp-banner">
                    <div className="demo-otp-header">
                      <span className="demo-otp-title">
                        โหมดทดสอบในเครื่อง (Simulator OTP)
                      </span>
                    </div>
                    <div className="demo-otp-code-wrap">
                      <span className="demo-otp-code">{demoOtp}</span>
                      <button
                        type="button"
                        className="btn-use-otp"
                        onClick={() => setOtp(demoOtp)}
                      >
                        ใส่รหัสนี้ทันที
                      </button>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#92400e" }}>
                      *เนื่องจากสภาพแวดล้อมจำลองยังไม่ได้เชื่อมต่อ SMTP Server จริง
                      ระบบจึงแสดง OTP ให้ท่านทดสอบได้อย่างสะดวก
                    </span>
                  </div>
                )}

                <div className="auth-input-group">
                  <label>
                    กรอกรหัสยืนยัน OTP (6 หลัก){" "}
                    {maskedEmail && (
                      <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                        ที่ส่งไปยัง {maskedEmail}
                      </span>
                    )}
                  </label>
                  <div className="auth-input-wrapper">
                    <FiKey className="input-icon" size={18} />
                    <input
                      type="text"
                      className="otp-input-large"
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                  <span className="field-hint">
                    รหัส OTP มีอายุ 15 นาทีหลังจากสร้างขึ้น
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="btn-cancel-demo"
                    onClick={() => {
                      setForgotStep(1);
                      setOtp("");
                      setError("");
                    }}
                    style={{ flex: 1, minHeight: "46px" }}
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    className="login-primary-btn"
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, marginTop: 0 }}
                  >
                    <FiCheckCircle size={18} />
                    {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP"}
                  </button>
                </div>

                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--up-purple-medium)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <FiRefreshCw size={13} /> ขอรหัส OTP อีกครั้ง
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form
                className="auth-form"
                onSubmit={handleResetPassword}
                noValidate
              >
                {/* New Password */}
                <div className="auth-input-group">
                  <label>รหัสผ่านใหม่</label>
                  <div className="auth-input-wrapper">
                    <FiLock className="input-icon" size={18} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="กรอกรหัสผ่านใหม่..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    >
                      {showNewPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="password-strength-wrap">
                      <div className="strength-bar-track">
                        <div
                          className={`strength-bar-fill strength-${newPassStrength.strength}`}
                          style={{
                            width: `${(newPassStrength.score / 4) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className="strength-label"
                        style={{ color: newPassStrength.color }}
                      >
                        {newPassStrength.label}
                      </span>
                    </div>
                  )}

                  {/* Password Requirements Checklist */}
                  <ul className="password-requirements">
                    <li
                      className={
                        newPassReq.minLength ? "req-met" : "req-unmet"
                      }
                    >
                      {newPassReq.minLength ? (
                        <FiCheck size={13} />
                      ) : (
                        <FiX size={13} />
                      )}
                      อย่างน้อย 8 ตัวอักษร
                    </li>
                    <li
                      className={
                        newPassReq.hasUppercase ? "req-met" : "req-unmet"
                      }
                    >
                      {newPassReq.hasUppercase ? (
                        <FiCheck size={13} />
                      ) : (
                        <FiX size={13} />
                      )}
                      ตัวพิมพ์ใหญ่ (A-Z)
                    </li>
                    <li
                      className={newPassReq.hasNumber ? "req-met" : "req-unmet"}
                    >
                      {newPassReq.hasNumber ? (
                        <FiCheck size={13} />
                      ) : (
                        <FiX size={13} />
                      )}
                      ตัวเลข (0-9)
                    </li>
                    <li
                      className={newPassReq.maxLength ? "req-met" : "req-unmet"}
                    >
                      {newPassReq.maxLength ? (
                        <FiCheck size={13} />
                      ) : (
                        <FiX size={13} />
                      )}
                      ไม่เกิน 128 ตัวอักษร
                    </li>
                  </ul>
                </div>

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <label>ยืนยันรหัสผ่านใหม่</label>
                  <div className="auth-input-wrapper">
                    <FiLock className="input-icon" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="กรอกยืนยันรหัสผ่านใหม่อีกครั้ง..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      title={
                        showConfirmPassword
                          ? "ซ่อนรหัสผ่าน"
                          : "แสดงรหัสผ่าน"
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span className="field-error-msg">
                      รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน
                    </span>
                  )}
                </div>

                <button
                  className="login-primary-btn"
                  type="submit"
                  disabled={loading}
                >
                  <FiCheckCircle size={18} />
                  {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                </button>
              </form>
            )}

            {/* Step 4: Success Screen */}
            {forgotStep === 4 && (
              <div className="reset-success-box">
                <div className="reset-success-icon">
                  <FiCheck />
                </div>
                <h3 className="reset-success-title">
                  เปลี่ยนรหัสผ่านสำเร็จแล้ว!
                </h3>
                <p className="reset-success-desc">
                  รหัสผ่านของบัญชี {identifier} ได้รับการอัปเดตเรียบร้อยแล้ว
                  ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                </p>
                <button
                  type="button"
                  className="login-primary-btn"
                  style={{ width: "100%", marginTop: "12px" }}
                  onClick={() =>
                    navigate(
                      `/login?identifier=${encodeURIComponent(
                        identifier
                      )}&reset=success`
                    )
                  }
                >
                  <FiUserCheck size={18} /> ไปที่หน้าเข้าสู่ระบบทันที
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2: DIRECT CHANGE PASSWORD FLOW
        ════════════════════════════════════════════════════════ */}
        {tabMode === "change" && (
          <form className="auth-form" onSubmit={handleChangePassword} noValidate>
            <div className="auth-input-group">
              <label>อีเมล หรือ ชื่อผู้ใช้งาน</label>
              <div className="auth-input-wrapper">
                <FiMail className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="กรอกอีเมล หรือ ชื่อผู้ใช้..."
                  value={changeIdentifier}
                  onChange={(e) => setChangeIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Current Password */}
            <div className="auth-input-group">
              <label>รหัสผ่านปัจจุบัน</label>
              <div className="auth-input-wrapper">
                <FiLock className="input-icon" size={18} />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านเดิมปัจจุบัน..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  title={
                    showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                  }
                >
                  {showCurrentPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="auth-input-group">
              <label>รหัสผ่านใหม่</label>
              <div className="auth-input-wrapper">
                <FiLock className="input-icon" size={18} />
                <input
                  type={showChangeNewPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่..."
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() =>
                    setShowChangeNewPassword(!showChangeNewPassword)
                  }
                  title={
                    showChangeNewPassword
                      ? "ซ่อนรหัสผ่าน"
                      : "แสดงรหัสผ่าน"
                  }
                >
                  {showChangeNewPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>

              {/* Strength Indicator */}
              {changeNewPassword && (
                <div className="password-strength-wrap">
                  <div className="strength-bar-track">
                    <div
                      className={`strength-bar-fill strength-${newPassStrength.strength}`}
                      style={{
                        width: `${(newPassStrength.score / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className="strength-label"
                    style={{ color: newPassStrength.color }}
                  >
                    {newPassStrength.label}
                  </span>
                </div>
              )}

              {/* Requirements Checklist */}
              <ul className="password-requirements">
                <li
                  className={newPassReq.minLength ? "req-met" : "req-unmet"}
                >
                  {newPassReq.minLength ? (
                    <FiCheck size={13} />
                  ) : (
                    <FiX size={13} />
                  )}
                  อย่างน้อย 8 ตัวอักษร
                </li>
                <li
                  className={
                    newPassReq.hasUppercase ? "req-met" : "req-unmet"
                  }
                >
                  {newPassReq.hasUppercase ? (
                    <FiCheck size={13} />
                  ) : (
                    <FiX size={13} />
                  )}
                  ตัวพิมพ์ใหญ่ (A-Z)
                </li>
                <li className={newPassReq.hasNumber ? "req-met" : "req-unmet"}>
                  {newPassReq.hasNumber ? (
                    <FiCheck size={13} />
                  ) : (
                    <FiX size={13} />
                  )}
                  ตัวเลข (0-9)
                </li>
                <li className={newPassReq.maxLength ? "req-met" : "req-unmet"}>
                  {newPassReq.maxLength ? (
                    <FiCheck size={13} />
                  ) : (
                    <FiX size={13} />
                  )}
                  ไม่เกิน 128 ตัวอักษร
                </li>
              </ul>
            </div>

            {/* Confirm New Password */}
            <div className="auth-input-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <div className="auth-input-wrapper">
                <FiLock className="input-icon" size={18} />
                <input
                  type={showChangeConfirmPassword ? "text" : "password"}
                  placeholder="กรอกยืนยันรหัสผ่านใหม่อีกครั้ง..."
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() =>
                    setShowChangeConfirmPassword(!showChangeConfirmPassword)
                  }
                  title={
                    showChangeConfirmPassword
                      ? "ซ่อนรหัสผ่าน"
                      : "แสดงรหัสผ่าน"
                  }
                >
                  {showChangeConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
              {changeConfirmPassword &&
                changeConfirmPassword !== changeNewPassword && (
                  <span className="field-error-msg">
                    รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน
                  </span>
                )}
            </div>

            <button
              className="login-primary-btn"
              type="submit"
              disabled={loading}
            >
              <FiShield size={18} />
              {loading ? "กำลังเปลี่ยนรหัสผ่าน..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="auth-footer">
          <span>จำรหัสผ่านได้แล้ว? </span>
          <Link to="/login">เข้าสู่ระบบที่นี่</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiUserPlus, FiArrowLeft, FiMail } from "react-icons/fi";
import { registerApi, getOAuthUrl, demoSocialLoginApi } from "../services/auth.service";
import "../css/Login.css";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDemoModal, setShowDemoModal] = useState<"google" | "microsoft" | null>(null);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoName, setDemoName] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 4) {
      setError("รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const data = await registerApi(username.trim(), email.trim(), password.trim());
      toast.success(data.message || "สมัครสมาชิกสำเร็จ");
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = async (provider: "google" | "microsoft") => {
    try {
      setLoading(true);
      const oauthData = await getOAuthUrl(provider);

      if (oauthData.isConfigured && oauthData.url) {
        window.location.href = oauthData.url;
      } else {
        setShowDemoModal(provider);
        setDemoEmail(provider === "google" ? "student.up@gmail.com" : "student@up.ac.th");
        setDemoName(provider === "google" ? "Google User" : "Microsoft User");
      }
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถเชื่อมต่อระบบ Social Login ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDemoModal || !demoEmail.trim()) return;

    try {
      setLoading(true);
      const data = await demoSocialLoginApi(showDemoModal, demoEmail.trim(), demoName.trim());

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: data.returnData.user_id,
          user_name: data.returnData.user_name,
          email: data.returnData.email,
          role: data.returnData.role,
        })
      );
      localStorage.setItem("user_id", data.returnData.user_id);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", String(data.returnData.role));
      localStorage.setItem("role_flg", String(data.returnData.role));

      toast.success(data.message || `สมัครและเข้าสู่ระบบด้วย ${showDemoModal} สำเร็จ`);
      setShowDemoModal(null);
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Social login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="back-btn" onClick={() => navigate("/")}>
          <FiArrowLeft /> หน้าหลัก
        </button>

        <div className="auth-brand-header">
          <div className="auth-logo-badge">UP</div>
          <h2>สมัครสมาชิก</h2>
          <p className="auth-subtitle">สร้างบัญชีผู้ใช้งานใหม่ในระบบ หรือเชื่อมต่อด้วย Social Account</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <div className="social-login-section">
          <button
            type="button"
            className="social-btn google-btn"
            onClick={() => handleSocialClick("google")}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>สมัครด้วย Google</span>
          </button>

          <button
            type="button"
            className="social-btn microsoft-btn"
            onClick={() => handleSocialClick("microsoft")}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 21 21" width="19" height="19">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>สมัครด้วย Microsoft</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>หรือกรอกข้อมูลสมัครสมาชิก</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>ชื่อผู้ใช้งาน (Username) <span className="required-star">*</span></label>
            <div className="auth-input-wrapper">
              <FiUser className="input-icon" size={18} />
              <input
                type="text"
                placeholder="กำหนดชื่อผู้ใช้..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>อีเมล (Email สำหรับกู้คืน/ผูกบัญชี)</label>
            <div className="auth-input-wrapper">
              <FiMail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="เช่น student@up.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>รหัสผ่าน (Password) <span className="required-star">*</span></label>
            <div className="auth-input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="กำหนดรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-input-group">
            <label>ยืนยันรหัสผ่าน <span className="required-star">*</span></label>
            <div className="auth-input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านอีกครั้ง..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button className="login-primary-btn" type="submit" disabled={loading}>
            <FiUserPlus size={18} />
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="auth-footer">
          <span>มีบัญชีผู้ใช้อยู่แล้ว? </span>
          <Link to="/login">เข้าสู่ระบบที่นี่</Link>
        </div>
      </div>

      {showDemoModal && (
        <div className="demo-modal-overlay" onClick={() => setShowDemoModal(null)}>
          <div className="demo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <span className="demo-badge">Social Login Simulator</span>
              <h3>สมัครด้วย {showDemoModal === "google" ? "Google" : "Microsoft"}</h3>
              <p>จำลองการสมัครและเชื่อมโยงบัญชีผ่าน OAuth 2.0</p>
            </div>

            <form onSubmit={handleDemoSocialSubmit}>
              <div className="auth-input-group">
                <label>อีเมลบัญชี {showDemoModal}</label>
                <div className="auth-input-wrapper">
                  <FiMail className="input-icon" size={18} />
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="เช่น student@up.ac.th"
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>ชื่อผู้ใช้งาน (Display Name)</label>
                <div className="auth-input-wrapper">
                  <FiUser className="input-icon" size={18} />
                  <input
                    type="text"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    required
                  />
                </div>
              </div>

              <div className="demo-modal-actions">
                <button
                  type="button"
                  className="btn-cancel-demo"
                  onClick={() => setShowDemoModal(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-confirm-demo" disabled={loading}>
                  ยืนยันสมัครสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;



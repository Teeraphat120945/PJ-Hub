import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowLeft, FiMail, FiCheckCircle } from "react-icons/fi";
import { loginApi, getOAuthUrl, demoSocialLoginApi } from "../services/auth.service";
import "../css/Login.css";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDemoModal, setShowDemoModal] = useState<"google" | "microsoft" | null>(null);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoName, setDemoName] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("user_id");
    const userName = searchParams.get("user_name");
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const provider = searchParams.get("provider") || "Social Account";
    const errorParam = searchParams.get("error");
    const demoParam = searchParams.get("oauth_demo");

    if (errorParam) {
      toast.error("การเข้าสู่ระบบผ่าน Social Login ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }

    if (demoParam === "google" || demoParam === "microsoft") {
      setShowDemoModal(demoParam);
    }

    if (token && userId) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: userId,
          user_name: userName || "User",
          email: email || "",
          role: role ? Number(role) : 3,
        })
      );
      localStorage.setItem("user_id", userId);
      localStorage.setItem("token", token);
      localStorage.setItem("role", String(role || 3));
      localStorage.setItem("role_flg", String(role || 3));

      toast.success(`เข้าสู่ระบบด้วย ${provider} สำเร็จ`);
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน");
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi(identifier.trim(), password.trim());

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

      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
     
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Unknown error");
      }
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

      toast.success(data.message || `เข้าสู่ระบบด้วย ${showDemoModal} สำเร็จ`);
      setShowDemoModal(null);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Unknown error");
      }
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
          <h2>เข้าสู่ระบบ</h2>
          <p className="auth-subtitle">ระบบคลังรายวิชาและผลงาน มหาวิทยาลัยพะเยา</p>
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
            <span>เข้าสู่ระบบด้วย Google</span>
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
            <span>เข้าสู่ระบบด้วย Microsoft</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>หรือเข้าสู่ระบบด้วยอีเมล / รหัสผ่าน</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>อีเมล หรือ ชื่อผู้ใช้งาน</label>
            <div className="auth-input-wrapper">
              <FiMail className="input-icon" size={18} />
              <input
                type="text"
                placeholder="กรอกอีเมล หรือ ชื่อผู้ใช้..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>รหัสผ่าน</label>
            <div className="auth-input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <button className="login-primary-btn" type="submit" disabled={loading}>
            <FiLogIn size={18} />
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="auth-footer">
          <span>ยังไม่มีบัญชีผู้ใช้? </span>
          <Link to="/register">สมัครสมาชิกที่นี่</Link>
        </div>
      </div>

      {showDemoModal && (
        <div className="demo-modal-overlay" onClick={() => setShowDemoModal(null)}>
          <div className="demo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <span className="demo-badge">Social Login Simulator</span>
              <h3>เข้าสู่ระบบด้วย {showDemoModal === "google" ? "Google" : "Microsoft"}</h3>
              <p>จำลองการยืนยันตัวตนผ่าน OAuth 2.0 พร้อมทดสอบระบบ <strong>Account Linking</strong> อัตโนมัติ</p>
            </div>

            <form onSubmit={handleDemoSocialSubmit}>
              <div className="auth-input-group">
                <label>อีเมลของบัญชี {showDemoModal}</label>
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
                <label>ชื่อผู้ใช้งานที่แสดง (Display Name)</label>
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
                  <FiCheckCircle size={16} /> ยืนยันเข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

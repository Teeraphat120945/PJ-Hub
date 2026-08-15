import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowLeft } from "react-icons/fi";
import "../css/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: data.returnData.user_id,
          user_name: data.returnData.user_name,
          role: data.returnData.role,
        }),
      );
      localStorage.setItem("user_id", data.returnData.user_id);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", String(data.returnData.role));
      localStorage.setItem("role_flg", String(data.returnData.role));
      toast.success("เข้าสู่ระบบสำเร็จ");
      navigate("/", { replace: true });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>ชื่อผู้ใช้งาน</label>
            <div className="auth-input-wrapper">
              <FiUser className="input-icon" size={18} />
              <input
                type="text"
                placeholder="กรอกชื่อผู้ใช้..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
    </div>
  );
}

export default Login;


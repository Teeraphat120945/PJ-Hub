import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiUserPlus, FiArrowLeft } from "react-icons/fi";
import "../css/Login.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ");
      navigate("/login");
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
          <h2>สมัครสมาชิก</h2>
          <p className="auth-subtitle">สร้างบัญชีผู้ใช้งานใหม่ในระบบ</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>ชื่อผู้ใช้งาน</label>
            <div className="auth-input-wrapper">
              <FiUser className="input-icon" size={18} />
              <input
                type="text"
                placeholder="กำหนดชื่อผู้ใช้..."
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
                placeholder="กำหนดรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            <label>ยืนยันรหัสผ่าน</label>
            <div className="auth-input-wrapper">
              <FiLock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านอีกครั้ง..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
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
    </div>
  );
}

export default Register;


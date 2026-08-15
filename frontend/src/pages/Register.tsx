import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLock, FiUser } from "react-icons/fi";
import universityLogo from "../assets/symbol_logo_up_1777530426.webp";
import "../css/Login.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("กรุณากรอก username และ password");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ");
      navigate("/Login");
    } catch {
      toast.warning("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="back-btn" onClick={() => navigate("/")}>
          <FiArrowLeft /> กลับหน้าหลัก
        </button>
        <div className="auth-brand"><span><img src={universityLogo} alt="ตราสัญลักษณ์มหาวิทยาลัยพะเยา" /></span><strong>PJ Hub</strong></div>
        <div className="auth-heading"><h1>สร้างบัญชีใหม่</h1><p>เริ่มต้นรวบรวมและแบ่งปันผลงานของคุณ</p></div>

        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="section-title" htmlFor="register-username">ชื่อผู้ใช้</label>
            <div className="input-with-icon"><FiUser />
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(username) => setUsername(username.target.value)}
            />
            </div>
          </div>
          <div className="field">
            <div className="form-section">
              <label className="section-title" htmlFor="register-password">รหัสผ่าน</label>
              <div className="input-with-icon"><FiLock />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(password) => setPassword(password.target.value)}
              />
              </div>
            </div>
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title" htmlFor="register-confirm-password">ยืนยันรหัสผ่าน</label>
              <div className="input-with-icon"><FiLock />
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(cf_password) =>
                  setConfirmPassword(cf_password.target.value)
                }
              />
              </div>
            </div>
          </div>

          <button className="login-primary-btn" type="submit">
            สร้างบัญชี
          </button>

          <div className="footer">
            <span>มีบัญชีอยู่แล้ว?</span><Link to="/Login">เข้าสู่ระบบ</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

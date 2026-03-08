import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
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
          ← Home
        </button>

        <h2>Register</h2>

        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="section-title">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(username) => setUsername(username.target.value)}
            />
          </div>
          <div className="field">
            <div className="form-section">
              <label className="section-title">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(password) => setPassword(password.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(cf_password) =>
                  setConfirmPassword(cf_password.target.value)
                }
              />
            </div>
          </div>

          <button className="login-primary-btn" type="submit">
            Register
          </button>

          <div className="footer">
            <Link to="/Login">Already have an account?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

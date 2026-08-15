import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiLock, FiUser } from "react-icons/fi";
import "../css/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return; // ✅ กันยิงซ้ำ

    setError("");

    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setLoading(true); // ✅ เริ่ม loading

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
          <FiArrowLeft /> กลับหน้าหลัก
        </button>
        <div className="auth-brand"><span><FiBookOpen /></span><strong>PJ Hub</strong></div>
        <div className="auth-heading"><h1>ยินดีต้อนรับกลับมา</h1><p>เข้าสู่ระบบเพื่อจัดการรายวิชาและผลงานของคุณ</p></div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
              <label className="section-title" htmlFor="login-username">ชื่อผู้ใช้</label>
              <div className="input-with-icon"><FiUser />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              </div>
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title" htmlFor="login-password">รหัสผ่าน</label>
              <div className="input-with-icon"><FiLock />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              </div>
            </div>
          </div>

          <button className="login-primary-btn" type="submit" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="footer">
          <span>ยังไม่มีบัญชี?</span><Link to="/register">สร้างบัญชีใหม่</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

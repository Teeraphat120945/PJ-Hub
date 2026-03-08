import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
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
          ← กลับหน้าหลัก
        </button>

        <h2>เข้าสู่ระบบ</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
              <label className="section-title">ชื่อผู้ใช้</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
          </div>

          <div className="field">
            <div className="form-section">
              <label className="section-title">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button className="login-primary-btn" type="submit" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
          </button>
        </form>

        <div className="footer">
          <Link to="/register">Create new account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

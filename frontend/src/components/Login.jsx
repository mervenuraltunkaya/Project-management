import React, { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  // -----------------------------
  // STATE TANIMLARI
  // -----------------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // -----------------------------
  // FORM GÖNDERİM FONKSİYONU
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // -----------------------------
      // SUNUCUYA GİRİŞ İSTEĞİ GÖNDER
      // -----------------------------
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Session cookie'leri için önemli
        body: JSON.stringify({ email, password }),
      });

      // -----------------------------
      // GİRİŞ BAŞARILI MI?
      // -----------------------------
      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(text || "Giriş başarısız.");
        window.scrollTo(0, 0);
      } else {
        // KULLANICI BİLGİLERİNİ AL - Bu satırı aktif hale getir
        const user = await res.json();
        console.log("Login başarılı, kullanıcı:", user);

        // Kullanıcı ID'sini localStorage'a kaydet
        localStorage.setItem("currentUserId", user.id.toString());
        localStorage.setItem("currentUser", JSON.stringify(user));

        setSuccessMsg("Giriş başarılı!");
        window.scrollTo(0, 0);

        // -----------------------------
        // BAŞARIDAN SONRA YÖNLENDİRME
        // -----------------------------
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          window.location.href = redirectPath;
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      // -----------------------------
      // SUNUCUYA ULAŞILAMAZSA / HATA OLURSA
      // -----------------------------
      console.error("Login error:", err);
      setErrorMsg("Sunucu hatası: " + err.message);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="page">
      <style>{`
        .page {
          min-height: 100vh;
          background-color: #f9fafb;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
        }
        .main-content {
          flex-grow: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem 1rem;
        }
        .form-container {
          background-color: #ffffff;
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #1d4ed8;
          margin-bottom: 2rem;
          letter-spacing: -0.5px;
        }
        .error-message, .success-message {
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
        }
        .success-message {
          background-color: #d1fae5;
          border: 1px solid #34d399;
          color: #065f46;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }
        .label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }
        .input {
          width: 93%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 1rem;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
        }
        .input:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }
        .submit-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #1d4ed8;
          color: #ffffff;
          font-weight: 700;
          border-radius: 1.5rem;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .submit-btn:hover {
          background-color: #2563eb;
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .login-link {
          text-align: center;
          margin-top: 1.5rem;
          font-weight: 500;
          color: #1d4ed8;
        }
        .login-link .link {
          text-decoration: underline;
          transition: color 0.2s;
        }
        .login-link .link:hover {
          color: #1e40af;
        }
      `}</style>

      <main className="main-content">
        <div className="form-container">
          <h1 className="title">Giriş Yap</h1>

          {errorMsg && <div className="error-message">{errorMsg}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="form">
            <div>
              <label htmlFor="email" className="label">
                E-Posta
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="input"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="input"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="submit-btn">
              Giriş Yap
            </button>
          </form>

          <p className="login-link">
            Henüz hesabınız yok mu?{" "}
            <Link to="/register" className="link">
              Kayıt ol
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;

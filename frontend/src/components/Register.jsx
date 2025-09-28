import React, { useEffect, useState } from "react";

function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
    roleId: "",
  });

  const [roles, setRoles] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => setRoles(data))
      .catch((err) => setErrorMsg("Roller alınamadı: " + err.message));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === "phoneNumber") {
      const digits = value.replace(/\D/g, "").substring(0, 10);
      formattedValue = digits
        .replace(/^(\d{3})(\d{3})(\d{0,4})$/, "($1) $2-$3")
        .trim()
        .replace(/-$/, "");
    }

    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      setErrorMsg("Geçerli bir e-posta adresi giriniz!");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setErrorMsg("Şifreler uyuşmuyor!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setErrorMsg(
        "Şifre en az 8 karakter olmalı, büyük harf, küçük harf, rakam ve özel karakter içermelidir."
      );
      return;
    }

    // Telefon kontrol (backend ile aynı formatta)
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(form.phoneNumber)) {
      setErrorMsg("Telefon numarası formatı hatalı! (Örn: (555) 555-5555)");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(text || "Kayıt başarısız.");
        window.scrollTo(0, 0);
      } else {
        setSuccessMsg("Kayıt başarılı, giriş yapabilirsiniz!");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: "",
          passwordConfirm: "",
          roleId: "",
        });
        window.scrollTo(0, 0);
      }
    } catch (err) {
      setErrorMsg("Sunucu hatası: " + err.message);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="page">
      <style>{`
      /* Genel sayfa düzeni */
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

      /* Form container */
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

      /* Başlık */
      .title {
        font-size: 2.25rem;
        font-weight: 800;
        color: #1d4ed8;
        margin-bottom: 2rem;
        letter-spacing: -0.5px;
      }

      /* Hata ve başarı mesajları */
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

      /* Form ve inputlar */
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

      .input, .select {
        width: 93%;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 1rem;
        font-size: 1rem;
        outline: none;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .input:focus, .select:focus {
        border-color: #1d4ed8;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
      }

      .input:hover, .select:hover {
        box-shadow: 0 4px 6px rgba(0,0,0,0.08);
      }

      .help-text {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }

      /* Buton */
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

      /* Link ve footer */
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
          <h1 className="title">Hesap Oluştur</h1>

          {errorMsg && <div className="error-message">{errorMsg}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="form">
            <div>
              <label htmlFor="firstName" className="label">
                Adınız
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="Adınızı girin"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="label">
                Soyadınız
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Soyadınızı girin"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                E-Posta
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="ornek@mail.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="label">
                Telefon
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Şifrenizi girin"
                className="input"
              />
              <small className="help-text">
                Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1
                özel karakter içermelidir.
              </small>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="label">
                Şifre Tekrar
              </label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                required
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder="Şifrenizi tekrar girin"
                className="input"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="role"
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "8px",
                  fontSize: "16px",
                  color: "#333",
                }}
                className="label"
              >
                Rol seçin:
              </label>
              <select
                name="roleId"
                id="role"
                required
                value={form.roleId}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
                className="select"
              >
                <option value="">Seçiniz</option>
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-btn">
              Kayıt Ol
            </button>
          </form>

          <p className="login-link">
            Zaten hesabınız var mı?{" "}
            <a href="/login" className="link">
              Giriş yapın
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;

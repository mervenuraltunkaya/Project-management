import React from "react";

const Footer = () => {
  const footerStyle = {
    height: "60px",
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "14px",
    flexShrink: 0, // Footer'ın küçülmemesi için
  };

  return (
    <footer style={footerStyle}>
      <div>© 2024 Proje Yönetim Sistemi. Tüm hakları saklıdır.</div>
    </footer>
  );
};

export default Footer;

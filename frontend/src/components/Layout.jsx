import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = ({ children, showSidebar = true, showFooter = true }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kullanıcıyı backend'den çek
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Kullanıcı bilgisi getiriliyor...");

        const response = await fetch("http://localhost:8080/api/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        console.log("API yanıtı:", response.status, response.statusText);

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Yetkisiz erişim - login'e yönlendiriliyor");
            navigate("/login", { replace: true });
            return;
          }
          throw new Error(
            `HTTP ${response.status}: Kullanıcı bilgisi alınamadı`
          );
        }

        const userData = await response.json();
        console.log("Kullanıcı bilgisi alındı:", userData);
        setUser(userData);
        setIsLoading(false);
      } catch (error) {
        console.error("Kullanıcı bilgisi alınırken hata:", error);
        setIsLoading(false);
        navigate("/login", { replace: true });
      }
    };

    fetchUser();
  }, [navigate]);

  // Logout işlemi
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  // Loading durumunda gösterilecek component
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f9fafb",
          fontSize: "18px",
          color: "#6b7280",
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  // User yüklenmemişse null döndür
  if (!user) {
    return null;
  }

  const layoutStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
    },
    content: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
    },
    main: {
      flex: 1,
      overflow: "auto",
      backgroundColor: "#f9fafb",
    },
  };

  return (
    <div style={layoutStyles.container}>
      {/* Header - En üstte */}
      <Header user={user} handleLogout={handleLogout} />

      {/* Ana içerik alanı */}
      <div style={layoutStyles.content}>
        {/* Sidebar - Sol tarafta (isteğe bağlı) */}
        {showSidebar && <Sidebar />}

        {/* Ana sayfa içeriği */}
        <main style={layoutStyles.main}>{children}</main>
      </div>

      {/* Footer - En altta (isteğe bağlı) */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;

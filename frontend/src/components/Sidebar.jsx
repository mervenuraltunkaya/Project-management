import React from "react";
import {
  FolderOpen,
  List,
  Users,
  FileText,
  Settings,
  Home,
  ClipboardList,
  Calendar,
} from "lucide-react";

const menusByModule = {
  "Proje Yönetim Sistemi": [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/projects", label: "Projeler", icon: FolderOpen },
    { path: "/tasks", label: "Görevler", icon: List },
    { path: "/team", label: "Takımlar", icon: Users },
    { path: "/fileUpload", label: "Dosyalar", icon: FileText },
    { path: "/calendar", label: "Takvim", icon: Calendar },
    //{ path: "/settings", label: "Ayarlar", icon: Settings },
  ],
};

const Sidebar = ({ currentPath = "/teams" }) => {
  // Yönlendirme fonksiyonu
  const navigateTo = (path) => {
    window.location.href = path;
  };

  // Mevcut path'i almak için
  const getCurrentPath = () => {
    return window.location.pathname || currentPath;
  };

  const menuItems = menusByModule["Proje Yönetim Sistemi"] || [];
  const activePath = getCurrentPath();

  return (
    <aside className="w-56 min-h-screen bg-gray-50 border-r border-gray-200 shadow-md flex flex-col">
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {menuItems.map(({ path, label, icon: Icon }) => {
          const active = activePath === path;
          return (
            <button
              key={path}
              onClick={() => navigateTo(path)}
              className={`
                group flex items-center gap-3 w-full text-left px-5 py-3 rounded-lg
                font-semibold text-base transition-colors duration-200 relative
                ${
                  active
                    ? "bg-cyan-100 text-cyan-700 shadow-md"
                    : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                focus-visible:ring-offset-1
              `}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-cyan-500 rounded-tr-lg rounded-br-lg" />
              )}
              <Icon
                className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${
                  active
                    ? "text-cyan-700"
                    : "text-gray-500 group-hover:text-cyan-500"
                }`}
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

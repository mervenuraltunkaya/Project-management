import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import logo from "../images/assan-logo.png";

const Header = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-gray-50 border-b border-gray-200 shadow-sm flex items-center justify-end px-10">
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-3 cursor-pointer select-none mr-auto"
        title="Ana Sayfa'ya Dön"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate("/");
        }}
      >
        <img
          src={logo}
          alt="Logo"
          className="h-32 object-contain"
          draggable={false}
        />
      </div>
      <div className="flex items-center gap-8">
        {user ? (
          <>
            <span className="text-gray-800 font-semibold text-lg select-none">
              {user.firstName} {user.lastName}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold
                       hover:bg-gray-300 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Çıkış Yap"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-800" />
              Çıkış Yap
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold
             hover:bg-blue-700 transition-colors
             focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Giriş Yap"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" aria-hidden="true" />
            Giriş Yap
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

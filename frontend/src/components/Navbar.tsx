import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "DASHBOARD", path: "/dashboard" },
    { label: "EVENTS", path: "/events" },
    { label: "TICKETS", path: "/tickets" },
    { label: "POS", path: "/pos" },
    { label: "VALIDATOR", path: "/validator" },
    { label: "SALES", path: "/sales" },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16 space-x-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-purple-200 text-gray-800"
                  : "text-gray-700 hover:bg-purple-100"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-purple-100 transition-colors flex items-center"
          >
            LOGOUT <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

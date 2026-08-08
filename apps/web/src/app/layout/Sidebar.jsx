import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <aside
      style={{
        width: "220px",
        background: "#374151",
        color: "white",
        padding: "20px",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {/* داشبورد */}
        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          داشبورد
        </Link>

        {isAdmin ? (
          <>
            {/* ================= ADMIN ================= */}

            <Link
              to="/users"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              کاربران
            </Link>

            <Link
              to="/admin/orders"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              مدیریت سفارش‌ها
            </Link>

            <Link
              to="/services"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              خدمات
            </Link>

            <Link
              to="/orders"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              سفارش‌ها
            </Link>

            <Link
              to="/notifications"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              اعلان‌ها
            </Link>
          </>
        ) : (
          <>
            {/* ================= USER ================= */}

            <Link
              to="/orders"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              سفارش‌ها
            </Link>

            <Link
              to="/notifications"
              style={{
                color: "white",
                textDecoration: "none",
              }}
            >
              اعلان‌ها
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function Sidebar() {
    const { logout, user } = useAuth();

    const isAdmin = user?.role === "admin";

    const linkStyle = ({ isActive }) => ({
        display: "block",
        padding: "12px 15px",
        marginBottom: "5px",
        color: isActive ? "#fff" : "#ddd",
        background: isActive ? "#2563eb" : "transparent",
        textDecoration: "none",
        borderRadius: "8px",
    });

    return (
        <aside
            style={{
                width: "220px",
                background: "#111827",
                padding: "20px",
                color: "#fff",
                boxSizing: "border-box",
            }}
        >
            <h3
                style={{
                    marginBottom: "25px",
                }}
            >
                Order Platform
            </h3>

            {/* داشبورد */}
            <NavLink
                to="/"
                style={linkStyle}
            >
                داشبورد
            </NavLink>

            {isAdmin ? (
                <>
                    {/* ================= ADMIN ================= */}

                    <NavLink
                        to="/users"
                        style={linkStyle}
                    >
                        کاربران
                    </NavLink>

                    <NavLink
                        to="/admin/orders"
                        style={linkStyle}
                    >
                        مدیریت سفارش‌ها
                    </NavLink>

                    <NavLink
                        to="/services"
                        style={linkStyle}
                    >
                        خدمات
                    </NavLink>

                    <NavLink
                        to="/orders"
                        style={linkStyle}
                    >
                        سفارش‌ها
                    </NavLink>

                    <NavLink
                        to="/notifications"
                        style={linkStyle}
                    >
                        اعلان‌ها
                    </NavLink>
                </>
            ) : (
                <>
                    {/* ================= USER ================= */}

                    <NavLink
                        to="/orders"
                        style={linkStyle}
                    >
                        سفارش‌ها
                    </NavLink>

                    <NavLink
                        to="/notifications"
                        style={linkStyle}
                    >
                        اعلان‌ها
                    </NavLink>
                </>
            )}

            {/* خروج */}
            <button
                onClick={logout}
                style={{
                    marginTop: "30px",
                    width: "100%",
                    padding: "10px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    border: "none",
                }}
            >
                خروج
            </button>
        </aside>
    );
}
import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import api from "../services/api";

export default function Home() {
    const { user } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const isAdmin = user?.role === "admin";

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const endpoint = isAdmin
                ? "/admin/dashboard"
                : "/dashboard";

            const data = await api(endpoint);

            if (!data.success) {
                throw new Error(
                    data.message || "خطا در دریافت داشبورد"
                );
            }

            setDashboard(data.dashboard);

        } catch (err) {
            console.error("Dashboard error:", err);

            setError(
                err.message ||
                "خطا در دریافت اطلاعات داشبورد"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            loadDashboard();
        }
    }, [user]);

    if (loading) {
        return (
            <h3>
                در حال دریافت داشبورد...
            </h3>
        );
    }

    if (error) {
        return (
            <div>
                <h3 style={{ color: "red" }}>
                    {error}
                </h3>

                <button onClick={loadDashboard}>
                    تلاش مجدد
                </button>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    // =========================
    // ADMIN DASHBOARD
    // =========================

    if (isAdmin) {
        const orders = dashboard.orders;
        const users = dashboard.users;
        const finance = dashboard.finance;

        return (
            <div>

                <h1>
                    سلام {user?.name}
                </h1>

                <h2 style={{ marginBottom: "25px" }}>
                    داشبورد مدیریت
                </h2>


                <h3>
                    سفارش‌ها
                </h3>

                <div style={gridStyle}>

                    <Card
                        title="کل سفارش‌ها"
                        value={orders.total}
                    />

                    <Card
                        title="در انتظار"
                        value={orders.pending}
                    />

                    <Card
                        title="در حال انجام"
                        value={orders.processing}
                    />

                    <Card
                        title="تکمیل شده"
                        value={orders.completed}
                    />

                    <Card
                        title="رد شده"
                        value={orders.rejected}
                    />

                </div>


                <h3 style={{ marginTop: "35px" }}>
                    اطلاعات کلی
                </h3>

                <div style={gridStyle}>

                    <Card
                        title="تعداد کاربران"
                        value={users.total}
                    />

                    <Card
                        title="درآمد کل"
                        value={`${Number(
                            finance.totalRevenue || 0
                        ).toLocaleString("fa-IR")} تومان`}
                    />

                    <Card
                        title="موجودی کل کیف پول‌ها"
                        value={`${Number(
                            finance.totalWalletBalance || 0
                        ).toLocaleString("fa-IR")} تومان`}
                    />

                </div>

            </div>
        );
    }


    // =========================
    // USER DASHBOARD
    // =========================

    return (
        <div>

            <h1>
                سلام {user?.name}
            </h1>

            <div
                style={{
                    background: "#fff",
                    padding: "25px",
                    marginTop: "25px",
                    borderRadius: "10px",
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >

                داشبورد کاربر

            </div>

        </div>
    );
}


function Card({ title, value }) {
    return (
        <div
            style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
            }}
        >

            <div
                style={{
                    color: "#6b7280",
                    marginBottom: "10px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                }}
            >
                {value}
            </div>

        </div>
    );
}


const gridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
};
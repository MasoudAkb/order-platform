import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function ServiceList() {
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadServices();
    }, []);

    async function loadServices() {
        try {
            setLoading(true);
            setError("");

            const data = await api("/services");

            if (!data.success) {
                throw new Error(
                    data.message || "دریافت سرویس‌ها ناموفق بود."
                );
            }

            setServices(data.services || []);
        } catch (err) {
            console.error(err);
            setError(
                err.message || "خطا در دریافت سرویس‌ها."
            );
        } finally {
            setLoading(false);
        }
    }

    function openService(serviceType) {
        navigate(
            `/services/${encodeURIComponent(serviceType)}`
        );
    }

    if (loading) {
        return (
            <div style={page}>
                <h2>در حال دریافت سرویس‌ها...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={page}>
                <div style={errorBox}>
                    {error}
                </div>

                <button
                    onClick={loadServices}
                    style={retryButton}
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div style={page}>

            <div style={header}>
                <h2>انتخاب سرویس</h2>
            </div>

            {services.length === 0 ? (
                <div style={emptyBox}>
                    در حال حاضر سرویسی برای ثبت سفارش وجود ندارد.
                </div>
            ) : (
                <div style={grid}>

                    {services.map((service) => (
                        <div
                            key={service.id}
                            style={card}
                        >
                            <h3 style={title}>
                                {service.title}
                            </h3>

                            <div style={type}>
                                {service.serviceType}
                            </div>

                            <div style={price}>
                                {Number(
                                    service.basePrice
                                ).toLocaleString("fa-IR")}

                                <span style={currency}>
                                    تومان
                                </span>
                            </div>

                            <button
                                onClick={() =>
                                    openService(
                                        service.serviceType
                                    )
                                }
                                style={button}
                            >
                                ثبت سفارش
                            </button>
                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

const page = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto"
};

const header = {
    marginBottom: "20px"
};

const grid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px"
};

const card = {
    background: "#fff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px #ddd"
};

const title = {
    margin: "0 0 8px",
    fontSize: "20px"
};

const type = {
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "16px"
};

const price = {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "18px"
};

const currency = {
    fontSize: "14px",
    fontWeight: "normal",
    marginRight: "5px"
};

const button = {
    width: "100%",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: "inherit"
};

const emptyBox = {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    color: "#64748b"
};

const errorBox = {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "12px"
};

const retryButton = {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "9px 16px",
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: "inherit"
};

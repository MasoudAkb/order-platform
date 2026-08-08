import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UserOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    async function loadOrders() {
        try {
            setLoading(true);
            setError("");

            const data = await api("/orders/history");

            setOrders(data.orders || []);
        } catch (err) {
            console.error(err);
            setError(err.message || "خطا در دریافت سفارش‌ها");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    if (loading) {
        return (
            <div>
                <h3>در حال دریافت سفارش‌ها...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h3 style={{ color: "red" }}>
                    {error}
                </h3>

                <button onClick={loadOrders}>
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div>
            <h2>
                سفارش‌های من
            </h2>

            {orders.length === 0 ? (
                <p>
                    هنوز سفارشی ثبت نکرده‌اید.
                </p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        background: "#fff",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead>
                        <tr>
                            <th>شماره</th>
                            <th>سرویس</th>
                            <th>قیمت</th>
                            <th>وضعیت</th>
                            <th>تاریخ</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                onClick={() =>
                                    navigate(`/orders/${order.id}`)
                                }
                                style={{
                                    cursor: "pointer",
                                }}
                            >
                                <td>
                                    {order.id}
                                </td>

                                <td>
                                    {order.title}
                                </td>

                                <td>
                                    {Number(
                                        order.price || 0
                                    ).toLocaleString("fa-IR")}
                                    {" تومان"}
                                </td>

                                <td>
                                    {order.status}
                                </td>

                                <td>
                                    {new Date(
                                        order.createdAt
                                    ).toLocaleDateString("fa-IR")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

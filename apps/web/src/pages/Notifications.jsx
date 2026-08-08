import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();


    async function loadNotifications() {

        try {

            setLoading(true);
            setError("");

            const data = await api(
                "/notifications"
            );

            setNotifications(
                data.notifications || []
            );

            setUnread(
                data.unread || 0
            );

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "خطا در دریافت اعلان‌ها"
            );

        } finally {

            setLoading(false);

        }

    }


    async function markAsRead(id) {

        try {

            await api(
                `/notifications/${id}/read`,
                {
                    method: "PATCH"
                }
            );

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            isRead: 1
                        }
                        : item
                )
            );

            setUnread((prev) =>
                prev > 0
                    ? prev - 1
                    : 0
            );

            return true;

        } catch (err) {

            console.error(err);

            return false;

        }

    }


    async function markAllAsRead() {

        try {

            await api(
                "/notifications/read-all",
                {
                    method: "PATCH"
                }
            );

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    isRead: 1
                }))
            );

            setUnread(0);

        } catch (err) {

            console.error(err);

        }

    }


    async function handleNotificationClick(item) {

        /*
         * اگر اعلان خوانده نشده است،
         * ابتدا آن را بخوان.
         */

        if (item.isRead === 0) {

            const success =
                await markAsRead(item.id);

            /*
             * اگر خواندن اعلان موفق نبود،
             * فعلاً وارد صفحه سفارش نشو.
             */

            if (!success) {
                return;
            }

        }


        /*
         * اگر اعلان مربوط به یک سفارش است،
         * صفحه همان سفارش را باز کن.
         *
         * مهم:
         * این مسیر برای User:
         *
         * /orders/:id
         *
         * است و دیگر به:
         *
         * /admin/orders/:id
         *
         * نمی‌رود.
         */

        if (item.orderId) {

            navigate(
                `/orders/${item.orderId}`
            );

        }

    }


    useEffect(() => {

        loadNotifications();

    }, []);


    if (loading) {

        return (
            <h3>
                در حال دریافت اعلان‌ها...
            </h3>
        );

    }


    if (error) {

        return (

            <div>

                <h3
                    style={{
                        color: "red"
                    }}
                >
                    {error}
                </h3>


                <button
                    onClick={
                        loadNotifications
                    }
                >
                    تلاش مجدد
                </button>

            </div>

        );

    }


    return (

        <div>

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                }}
            >

                <div>

                    <h2>
                        اعلان‌ها
                    </h2>

                    <p>

                        اعلان‌های
                        خوانده‌نشده:{" "}

                        <strong>
                            {unread}
                        </strong>

                    </p>

                </div>


                {unread > 0 && (

                    <button
                        onClick={
                            markAllAsRead
                        }
                    >
                        خواندن همه
                    </button>

                )}

            </div>


            {notifications.length === 0 ? (

                <p>
                    اعلانی وجود ندارد.
                </p>

            ) : (

                <div
                    style={{
                        display: "flex",
                        flexDirection:
                            "column",
                        gap: "10px"
                    }}
                >

                    {notifications.map(
                        (item) => (

                            <div
                                key={item.id}

                                onClick={() =>
                                    handleNotificationClick(
                                        item
                                    )
                                }

                                style={{
                                    background:
                                        item.isRead === 0
                                            ? "#e0f2fe"
                                            : "#fff",

                                    padding:
                                        "15px",

                                    borderRadius:
                                        "8px",

                                    border:
                                        "1px solid #ddd",

                                    cursor:
                                        item.orderId ||
                                        item.isRead === 0
                                            ? "pointer"
                                            : "default",

                                    transition:
                                        "background 0.2s"
                                }}
                            >

                                <h4
                                    style={{
                                        margin:
                                            "0 0 8px 0"
                                    }}
                                >
                                    {item.title}
                                </h4>


                                <p
                                    style={{
                                        margin:
                                            "0 0 8px 0"
                                    }}
                                >
                                    {item.body}
                                </p>


                                <small>

                                    {new Date(
                                        item.createdAt
                                    ).toLocaleString(
                                        "fa-IR"
                                    )}

                                </small>


                                {item.isRead === 0 && (

                                    <span
                                        style={{
                                            marginRight:
                                                "10px",

                                            fontSize:
                                                "12px",

                                            color:
                                                "#2563eb"
                                        }}
                                    >
                                        خوانده نشده
                                    </span>

                                )}

                            </div>

                        )
                    )}

                </div>

            )}

        </div>

    );

}

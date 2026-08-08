import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import api from "../services/api";

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = user?.role === "admin";

    const [order, setOrder] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [details, setDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const [showRejectBox, setShowRejectBox] = useState(false);
    const [completeMessage, setCompleteMessage] = useState("");
    const [showCompleteBox, setShowCompleteBox] = useState(false);


    async function loadOrder() {

        try {

            setLoading(true);
            setError("");

            /*
             * Admin:
             * GET /admin/orders/:id
             *
             * User:
             * GET /orders/:id
             */

            const endpoint = isAdmin
                ? `/admin/orders/${id}`
                : `/orders/${id}`;

            const data = await api(endpoint);

            if (!data.success) {
                throw new Error(
                    data.message || "خطا در دریافت سفارش"
                );
            }

            setOrder(data.order || null);

            /*
             * اطلاعات مشتری فقط در پاسخ Admin
             */
            setCustomer(data.customer || null);

            setDetails(data.details || null);
            setMessages(data.messages || []);
            setHistory(data.history || []);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "خطا در دریافت اطلاعات سفارش"
            );

        } finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        if (user) {
            loadOrder();
        }

    }, [id, user]);


    /*
     * =========================
     * ADMIN ACTIONS
     * =========================
     */

    async function approveOrder() {

        if (!isAdmin || !order) return;

        const confirmed = window.confirm(
            "آیا از تأیید این سفارش مطمئن هستید؟"
        );

        if (!confirmed) return;

        try {

            setActionLoading(true);
            setError("");

            const data = await api(
                `/admin/orders/${order.id}/approve`,
                {
                    method: "POST"
                }
            );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "تأیید سفارش انجام نشد"
                );

            }

            alert(
                `سفارش تأیید شد.\nقیمت ثبت شده: ${Number(
                    data.price
                ).toLocaleString("fa-IR")} تومان`
            );

            await loadOrder();

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "خطا در تأیید سفارش"
            );

        } finally {

            setActionLoading(false);

        }

    }


    async function rejectOrder() {

        if (!isAdmin || !order) return;

        if (!rejectReason.trim()) {

            alert(
                "لطفاً دلیل رد سفارش را وارد کنید."
            );

            return;

        }

        const confirmed = window.confirm(
            "آیا از رد کردن این سفارش مطمئن هستید؟"
        );

        if (!confirmed) return;

        try {

            setActionLoading(true);
            setError("");

            const data = await api(
                `/admin/orders/${order.id}/reject`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        reason:
                            rejectReason.trim()
                    })
                }
            );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "رد سفارش انجام نشد"
                );

            }

            setOrder(data.order);

            setRejectReason("");
            setShowRejectBox(false);

            alert(
                "سفارش با موفقیت رد شد."
            );

            await loadOrder();

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "خطا در رد سفارش"
            );

        } finally {

            setActionLoading(false);

        }

    }


    async function completeOrder() {

        if (!isAdmin || !order) return;

        try {

            setActionLoading(true);
            setError("");

            const data = await api(
                `/admin/orders/${order.id}/complete`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        result:
                            completeMessage.trim()
                    })
                }
            );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "تکمیل سفارش انجام نشد"
                );

            }

            alert(
                "سفارش با موفقیت تکمیل شد."
            );

            setCompleteMessage("");
            setShowCompleteBox(false);

            await loadOrder();

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "خطا در تکمیل سفارش"
            );

        } finally {

            setActionLoading(false);

        }

    }


    if (loading) {

        return (
            <div style={page}>
                <h3>
                    در حال دریافت اطلاعات سفارش...
                </h3>
            </div>
        );

    }


    if (error && !order) {

        return (

            <div style={page}>

                <button
                    onClick={() =>
                        navigate("/orders")
                    }
                    style={backButton}
                >
                    ← بازگشت به سفارش‌ها
                </button>

                <div style={errorBox}>
                    {error}
                </div>

            </div>

        );

    }


    if (!order) {

        return (

            <div style={page}>
                <p>
                    سفارش پیدا نشد.
                </p>
            </div>

        );

    }


    return (

        <div style={page}>

            {/* Header */}

            <div style={header}>

                <div>

                    <button
                        onClick={() =>
                            navigate(
                                isAdmin
                                    ? "/admin/orders"
                                    : "/orders"
                            )
                        }
                        style={backButton}
                    >
                        ← بازگشت
                    </button>

                    <h1
                        style={{
                            marginTop: "15px"
                        }}
                    >
                        جزئیات سفارش #{order.id}
                    </h1>

                </div>


                <div
                    style={statusBadge(
                        order.status
                    )}
                >
                    {getStatusText(
                        order.status
                    )}
                </div>

            </div>


            {/* Error */}

            {error && (

                <div style={errorBox}>
                    {error}
                </div>

            )}


            {/* =========================
                ADMIN ACTIONS
            ========================= */}

            {isAdmin && (

                <>

                    <div style={actionBox}>

                        {order.status === "pending" && (

                            <>

                                <button
                                    onClick={approveOrder}
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        approveButton
                                    }
                                >
                                    {actionLoading
                                        ? "در حال پردازش..."
                                        : "✓ تأیید سفارش"}
                                </button>


                                <button
                                    onClick={() =>
                                        setShowRejectBox(
                                            !showRejectBox
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        rejectButton
                                    }
                                >
                                    ✕ رد سفارش
                                </button>

                            </>

                        )}


                        {order.status === "processing" && (

                            <>

                                <button
                                    onClick={() =>
                                        setShowRejectBox(
                                            !showRejectBox
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        rejectButton
                                    }
                                >
                                    ✕ رد سفارش
                                </button>


                                <button
                                    onClick={() =>
                                        setShowCompleteBox(
                                            !showCompleteBox
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        approveButton
                                    }
                                >
                                    ✓ تکمیل سفارش
                                </button>

                            </>

                        )}


                        {order.status === "rejected" && (

                            <div
                                style={
                                    rejectedMessage
                                }
                            >
                                این سفارش رد شده است.
                            </div>

                        )}


                        {order.status !== "pending" &&
                            order.status !== "processing" &&
                            order.status !== "rejected" && (

                                <div
                                    style={
                                        infoMessage
                                    }
                                >
                                    وضعیت فعلی سفارش:{" "}
                                    {getStatusText(
                                        order.status
                                    )}
                                </div>

                            )}

                    </div>


                    {/* Reject box */}

                    {showRejectBox && (

                        <div
                            style={
                                rejectBox
                            }
                        >

                            <h3>
                                دلیل رد سفارش
                            </h3>


                            <textarea
                                value={
                                    rejectReason
                                }
                                onChange={(e) =>
                                    setRejectReason(
                                        e.target.value
                                    )
                                }
                                placeholder={
                                    "دلیل رد سفارش را وارد کنید..."
                                }
                                rows={4}
                                style={textarea}
                            />


                            <div
                                style={{
                                    marginTop:
                                        "10px"
                                }}
                            >

                                <button
                                    onClick={
                                        rejectOrder
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        rejectConfirmButton
                                    }
                                >
                                    {actionLoading
                                        ? "در حال ثبت..."
                                        : "ثبت رد سفارش"}
                                </button>


                                <button
                                    onClick={() => {

                                        setShowRejectBox(
                                            false
                                        );

                                        setRejectReason(
                                            ""
                                        );

                                    }}
                                    style={
                                        cancelButton
                                    }
                                >
                                    انصراف
                                </button>

                            </div>

                        </div>

                    )}


                    {/* Complete box */}

                    {showCompleteBox && (

                        <div
                            style={
                                rejectBox
                            }
                        >

                            <h3>
                                نتیجه سفارش
                            </h3>


                            <textarea
                                value={
                                    completeMessage
                                }
                                onChange={(e) =>
                                    setCompleteMessage(
                                        e.target.value
                                    )
                                }
                                placeholder={
                                    "مثلاً اطلاعات اپل آیدی آماده شد..."
                                }
                                rows={4}
                                style={textarea}
                            />


                            <div
                                style={{
                                    marginTop:
                                        "10px"
                                }}
                            >

                                <button
                                    onClick={
                                        completeOrder
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        approveButton
                                    }
                                >
                                    {actionLoading
                                        ? "در حال ثبت..."
                                        : "ثبت و تکمیل سفارش"}
                                </button>


                                <button
                                    onClick={() => {

                                        setShowCompleteBox(
                                            false
                                        );

                                        setCompleteMessage(
                                            ""
                                        );

                                    }}
                                    style={
                                        cancelButton
                                    }
                                >
                                    انصراف
                                </button>

                            </div>

                        </div>

                    )}

                </>

            )}


            {/* Customer */}

            {isAdmin && (

                <section style={card}>

                    <h2>
                        اطلاعات مشتری
                    </h2>

                    <div style={grid}>

                        <InfoItem
                            title="نام"
                            value={
                                customer?.name ||
                                "-"
                            }
                        />

                        <InfoItem
                            title="شماره تماس"
                            value={
                                customer?.phone ||
                                "-"
                            }
                        />

                        <InfoItem
                            title="شناسه کاربر"
                            value={
                                customer?.id ||
                                "-"
                            }
                        />

                    </div>

                </section>

            )}


            {/* Order information */}

            <section style={card}>

                <h2>
                    اطلاعات سفارش
                </h2>

                <div style={grid}>

                    <InfoItem
                        title="شناسه سفارش"
                        value={order.id}
                    />

                    <InfoItem
                        title="سرویس"
                        value={
                            order.title ||
                            "-"
                        }
                    />

                    <InfoItem
                        title="وضعیت"
                        value={
                            getStatusText(
                                order.status
                            )
                        }
                    />

                    <InfoItem
                        title="وضعیت پرداخت"
                        value={
                            order.paymentStatus ||
                            "-"
                        }
                    />

                    <InfoItem
                        title="قیمت"
                        value={
                            order.price
                                ? formatPrice(
                                    order.price
                                )
                                : "-"
                        }
                    />

                    <InfoItem
                        title="تاریخ ایجاد"
                        value={
                            formatDate(
                                order.createdAt
                            )
                        }
                    />

                    <InfoItem
                        title="آخرین بروزرسانی"
                        value={
                            formatDate(
                                order.updatedAt
                            )
                        }
                    />

                    {order.approvedAt && (

                        <InfoItem
                            title="تاریخ تأیید"
                            value={
                                formatDate(
                                    order.approvedAt
                                )
                            }
                        />

                    )}

                </div>

            </section>


            {/* Reject reason */}

            {order.rejectReason && (

                <section style={card}>

                    <h2>
                        دلیل رد سفارش
                    </h2>

                    <div
                        style={
                            rejectedReason
                        }
                    >
                        {order.rejectReason}
                    </div>

                </section>

            )}


            {/* Order details */}

            {details && (

                <section style={card}>

                    <h2>
                        جزئیات سفارش
                    </h2>

                    {details.data ? (

                        <pre
                            style={jsonBox}
                        >
                            {JSON.stringify(
                                details.data,
                                null,
                                2
                            )}
                        </pre>

                    ) : (

                        <pre
                            style={jsonBox}
                        >
                            {JSON.stringify(
                                details,
                                null,
                                2
                            )}
                        </pre>

                    )}

                </section>

            )}


            {/* Messages */}

            <section style={card}>

                <h2>
                    پیام‌ها
                </h2>


                {messages.length === 0 ? (

                    <p style={muted}>
                        پیامی برای این سفارش
                        ثبت نشده است.
                    </p>

                ) : (

                    <div>

                        {messages.map(
                            (message) => (

                                <div
                                    key={
                                        message.id
                                    }
                                    style={
                                        messageBox
                                    }
                                >

                                    <div
                                        style={
                                            messageHeader
                                        }
                                    >

                                        <strong>
                                            {
                                                message.senderName ||
                                                message.sender ||
                                                "پیام"
                                            }
                                        </strong>


                                        <span
                                            style={
                                                muted
                                            }
                                        >
                                            {
                                                formatDate(
                                                    message.createdAt
                                                )
                                            }
                                        </span>

                                    </div>


                                    <p>
                                        {
                                            message.body ||
                                            message.message ||
                                            message.content ||
                                            "-"
                                        }
                                    </p>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* Status history */}

            <section style={card}>

                <h2>
                    تاریخچه وضعیت
                </h2>


                {history.length === 0 ? (

                    <p style={muted}>
                        تاریخچه‌ای ثبت نشده است.
                    </p>

                ) : (

                    <div>

                        {history.map(
                            (item) => (

                                <div
                                    key={
                                        item.id
                                    }
                                    style={
                                        historyItem
                                    }
                                >

                                    <div>

                                        <strong>
                                            {
                                                getStatusText(
                                                    item.oldStatus
                                                )
                                            }
                                        </strong>

                                        {" → "}

                                        <strong>
                                            {
                                                getStatusText(
                                                    item.newStatus
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        style={
                                            muted
                                        }
                                    >
                                        {
                                            formatDate(
                                                item.createdAt
                                            )
                                        }
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>

        </div>

    );
}


/* -------------------------
   Components
------------------------- */

function InfoItem({ title, value }) {

    return (

        <div style={infoItem}>

            <div style={infoTitle}>
                {title}
            </div>

            <div style={infoValue}>
                {value}
            </div>

        </div>

    );

}


/* -------------------------
   Helpers
------------------------- */

function getStatusText(status) {

    const statuses = {

        pending: "در انتظار بررسی",

        processing: "در حال پردازش",

        completed: "تکمیل شده",

        rejected: "رد شده",

        cancelled: "لغو شده"

    };

    return statuses[status] ||
        status ||
        "-";

}


function formatPrice(value) {

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return `${number.toLocaleString(
        "fa-IR"
    )} تومان`;

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {
        return value;
    }

    return date.toLocaleString(
        "fa-IR"
    );

}


/* -------------------------
   Styles
------------------------- */

const page = {

    padding: "20px",

    maxWidth: "1200px",

    margin: "0 auto"

};


const header = {

    display: "flex",

    justifyContent:
        "space-between",

    alignItems:
        "flex-start",

    marginBottom:
        "20px"

};


const card = {

    background: "#fff",

    padding: "20px",

    borderRadius: "10px",

    boxShadow:
        "0 2px 8px #ddd",

    marginBottom:
        "20px"

};


const grid = {

    display: "grid",

    gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",

    gap: "15px",

    marginTop: "15px"

};


const infoItem = {

    padding: "15px",

    background: "#f8fafc",

    borderRadius: "8px"

};


const infoTitle = {

    fontSize: "13px",

    color: "#64748b",

    marginBottom: "7px"

};


const infoValue = {

    fontSize: "16px",

    fontWeight: "600"

};


const backButton = {

    border: "none",

    background: "#e5e7eb",

    padding: "8px 14px",

    borderRadius: "7px",

    cursor: "pointer"

};


const actionBox = {

    background: "#fff",

    padding: "15px",

    borderRadius: "10px",

    boxShadow:
        "0 2px 8px #ddd",

    marginBottom: "20px",

    display: "flex",

    gap: "10px",

    alignItems: "center"

};


const approveButton = {

    border: "none",

    background: "#16a34a",

    color: "#fff",

    padding: "11px 18px",

    borderRadius: "7px",

    cursor: "pointer",

    fontWeight: "600"

};


const rejectButton = {

    border: "none",

    background: "#dc2626",

    color: "#fff",

    padding: "11px 18px",

    borderRadius: "7px",

    cursor: "pointer",

    fontWeight: "600"

};


const rejectConfirmButton = {

    border: "none",

    background: "#dc2626",

    color: "#fff",

    padding: "10px 16px",

    borderRadius: "7px",

    cursor: "pointer",

    marginLeft: "8px"

};


const cancelButton = {

    border: "none",

    background: "#e5e7eb",

    padding: "10px 16px",

    borderRadius: "7px",

    cursor: "pointer"

};


const rejectBox = {

    background: "#fff7ed",

    border:
        "1px solid #fed7aa",

    padding: "20px",

    borderRadius: "10px",

    marginBottom: "20px"

};


const textarea = {

    width: "100%",

    boxSizing: "border-box",

    padding: "10px",

    borderRadius: "7px",

    border:
        "1px solid #ccc",

    resize: "vertical",

    fontFamily: "inherit"

};


const errorBox = {

    background: "#fee2e2",

    color: "#991b1b",

    padding: "12px 15px",

    borderRadius: "8px",

    marginBottom: "20px"

};


const rejectedReason = {

    background: "#fef2f2",

    color: "#991b1b",

    padding: "15px",

    borderRadius: "8px"

};


const rejectedMessage = {

    color: "#991b1b",

    fontWeight: "600"

};


const infoMessage = {

    color: "#475569",

    fontWeight: "600"

};


const jsonBox = {

    background: "#111827",

    color: "#e5e7eb",

    padding: "15px",

    borderRadius: "8px",

    overflowX: "auto",

    direction: "ltr",

    textAlign: "left"

};


const messageBox = {

    border:
        "1px solid #e5e7eb",

    padding: "12px",

    borderRadius: "8px",

    marginBottom: "10px"

};


const messageHeader = {

    display: "flex",

    justifyContent:
        "space-between",

    marginBottom: "8px"

};


const historyItem = {

    display: "flex",

    justifyContent:
        "space-between",

    padding: "12px 0",

    borderBottom:
        "1px solid #eee"

};


const muted = {

    color: "#64748b"

};


function statusBadge(status) {

    const colors = {

        pending: {

            background:
                "#fef3c7",

            color:
                "#92400e"

        },

        processing: {

            background:
                "#dbeafe",

            color:
                "#1e40af"

        },

        completed: {

            background:
                "#dcfce7",

            color:
                "#166534"

        },

        rejected: {

            background:
                "#fee2e2",

            color:
                "#991b1b"

        }

    };


    return {

        padding: "8px 14px",

        borderRadius: "20px",

        fontWeight: "600",

        ...(colors[status] || {

            background:
                "#e5e7eb",

            color:
                "#374151"

        })

    };

}

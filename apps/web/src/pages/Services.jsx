import { useEffect, useState } from "react";
import api from "../services/api";

export default function Services() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingType, setEditingType] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editPrice, setEditPrice] = useState("");

    const [showAdd, setShowAdd] = useState(false);
    const [newType, setNewType] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newPrice, setNewPrice] = useState("");

    const [actionLoading, setActionLoading] = useState(false);


    async function loadServices() {
        try {
            setLoading(true);
            setError("");

            const data = await api("/admin/services");

            setServices(data.services || []);
        }
        catch (err) {
            console.error(err);
            setError(err.message || "خطا در دریافت سرویس‌ها");
        }
        finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        loadServices();
    }, []);


    function startEdit(service) {
        setEditingType(service.serviceType);
        setEditTitle(service.title);
        setEditPrice(service.basePrice);
    }


    function cancelEdit() {
        setEditingType(null);
        setEditTitle("");
        setEditPrice("");
    }


    async function saveEdit(type) {
        if (!editTitle.trim()) {
            alert("عنوان سرویس را وارد کنید.");
            return;
        }

        const price = Number(editPrice);

        if (!price || price <= 0) {
            alert("قیمت معتبر وارد کنید.");
            return;
        }


        try {
            setActionLoading(true);

            const data = await api(
                `/admin/services/${encodeURIComponent(type)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        title: editTitle.trim(),
                        basePrice: price
                    })
                }
            );


            if (!data.success) {
                throw new Error(
                    data.message || "ویرایش سرویس انجام نشد"
                );
            }


            setServices(prev =>
                prev.map(service =>
                    service.serviceType === type
                        ? data.service
                        : service
                )
            );


            cancelEdit();

        }
        catch (err) {
            console.error(err);
            alert(err.message || "خطا در ویرایش سرویس");
        }
        finally {
            setActionLoading(false);
        }
    }


    async function addService() {
        if (!newType.trim()) {
            alert("نوع سرویس را وارد کنید.");
            return;
        }

        if (!newTitle.trim()) {
            alert("عنوان سرویس را وارد کنید.");
            return;
        }

        const price = Number(newPrice);

        if (!price || price <= 0) {
            alert("قیمت معتبر وارد کنید.");
            return;
        }


        try {
            setActionLoading(true);

            const data = await api(
                "/admin/services",
                {
                    method: "POST",
                    body: JSON.stringify({
                        serviceType: newType.trim(),
                        title: newTitle.trim(),
                        basePrice: price
                    })
                }
            );


            if (!data.success) {
                throw new Error(
                    data.message || "افزودن سرویس انجام نشد"
                );
            }


            setServices(prev => [
                data.service,
                ...prev
            ]);


            setNewType("");
            setNewTitle("");
            setNewPrice("");
            setShowAdd(false);

        }
        catch (err) {
            console.error(err);
            alert(err.message || "خطا در افزودن سرویس");
        }
        finally {
            setActionLoading(false);
        }
    }


    if (loading) {
        return <h3>در حال دریافت سرویس‌ها...</h3>;
    }


    if (error) {
        return (
            <h3 style={{ color: "red" }}>
                {error}
            </h3>
        );
    }


    return (
        <div style={page}>

            <div style={header}>

                <h2>
                    مدیریت سرویس‌ها
                </h2>

                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={addButton}
                >
                    {showAdd
                        ? "بستن"
                        : "+ افزودن سرویس"}
                </button>

            </div>


            {showAdd && (
                <div style={addBox}>

                    <h3>
                        افزودن سرویس جدید
                    </h3>


                    <div style={formGrid}>

                        <input
                            value={newType}
                            onChange={e =>
                                setNewType(e.target.value)
                            }
                            placeholder="نوع سرویس، مثلاً apple_id"
                            style={input}
                        />


                        <input
                            value={newTitle}
                            onChange={e =>
                                setNewTitle(e.target.value)
                            }
                            placeholder="عنوان سرویس"
                            style={input}
                        />


                        <input
                            type="number"
                            value={newPrice}
                            onChange={e =>
                                setNewPrice(e.target.value)
                            }
                            placeholder="قیمت"
                            style={input}
                        />

                    </div>


                    <button
                        onClick={addService}
                        disabled={actionLoading}
                        style={saveButton}
                    >
                        {actionLoading
                            ? "در حال ثبت..."
                            : "ثبت سرویس"}
                    </button>

                </div>
            )}


            {services.length === 0 ? (

                <div style={emptyBox}>
                    هنوز سرویسی ثبت نشده است.
                </div>

            ) : (

                <div style={card}>

                    <table style={table}>

                        <thead>

                            <tr>

                                <th style={th}>
                                    ID
                                </th>

                                <th style={th}>
                                    نوع سرویس
                                </th>

                                <th style={th}>
                                    عنوان
                                </th>

                                <th style={th}>
                                    قیمت
                                </th>

                                <th style={th}>
                                    آخرین بروزرسانی
                                </th>

                                <th style={th}>
                                    عملیات
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {services.map(service => {

                                const editing =
                                    editingType ===
                                    service.serviceType;


                                return (

                                    <tr
                                        key={service.id}
                                    >

                                        <td style={td}>
                                            {service.id}
                                        </td>


                                        <td style={td}>
                                            {service.serviceType}
                                        </td>


                                        <td style={td}>

                                            {editing ? (

                                                <input
                                                    value={editTitle}
                                                    onChange={e =>
                                                        setEditTitle(
                                                            e.target.value
                                                        )
                                                    }
                                                    style={input}
                                                />

                                            ) : (

                                                service.title

                                            )}

                                        </td>


                                        <td style={td}>

                                            {editing ? (

                                                <input
                                                    type="number"
                                                    value={editPrice}
                                                    onChange={e =>
                                                        setEditPrice(
                                                            e.target.value
                                                        )
                                                    }
                                                    style={input}
                                                />

                                            ) : (

                                                <>
                                                    {Number(
                                                        service.basePrice
                                                    ).toLocaleString(
                                                        "fa-IR"
                                                    )}
                                                    {" تومان"}
                                                </>

                                            )}

                                        </td>


                                        <td style={td}>

                                            {service.updatedAt
                                                ? new Date(
                                                    service.updatedAt
                                                ).toLocaleString(
                                                    "fa-IR"
                                                )
                                                : "-"}

                                        </td>


                                        <td style={td}>

                                            {editing ? (

                                                <div style={actions}>

                                                    <button
                                                        onClick={() =>
                                                            saveEdit(
                                                                service.serviceType
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        style={
                                                            saveButton
                                                        }
                                                    >
                                                        ذخیره
                                                    </button>


                                                    <button
                                                        onClick={
                                                            cancelEdit
                                                        }
                                                        style={
                                                            cancelButton
                                                        }
                                                    >
                                                        انصراف
                                                    </button>

                                                </div>

                                            ) : (

                                                <button
                                                    onClick={() =>
                                                        startEdit(
                                                            service
                                                        )
                                                    }
                                                    style={
                                                        editButton
                                                    }
                                                >
                                                    ویرایش
                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                );

                            })}

                        </tbody>

                    </table>

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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
};


const card = {
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 8px #ddd",
    overflow: "auto"
};


const table = {
    width: "100%",
    borderCollapse: "collapse"
};


const th = {
    padding: "12px",
    textAlign: "right",
    borderBottom: "1px solid #ddd",
    background: "#f8fafc"
};


const td = {
    padding: "12px",
    borderBottom: "1px solid #eee"
};


const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontFamily: "inherit"
};


const formGrid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    marginBottom: "15px"
};


const addBox = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px #ddd",
    marginBottom: "20px"
};


const addButton = {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "7px",
    cursor: "pointer"
};


const editButton = {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer"
};


const saveButton = {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer"
};


const cancelButton = {
    border: "none",
    background: "#e5e7eb",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer"
};


const actions = {
    display: "flex",
    gap: "6px"
};


const emptyBox = {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    color: "#64748b"
};
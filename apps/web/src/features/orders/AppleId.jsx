import { useEffect, useState } from "react";
import api from "../../services/api";

const SERVICES = [
    {
        type: "apple_id_with_email",
        label: "ساخت Apple ID با ایمیل مشتری",
    },
    {
        type: "apple_id_without_email",
        label: "ساخت Apple ID بدون ایمیل مشتری",
    },
];

const EMPTY_FORM = {
    email: "",
    fullName: "",
    phone: "",
    password: "",
    birthDate: "",
    security1: "",
    security2: "",
    security3: "",
};

export default function AppleId() {
    const [services, setServices] = useState({});
    const [serviceType, setServiceType] = useState(
        "apple_id_with_email"
    );

    const [form, setForm] = useState({
        ...EMPTY_FORM,
    });

    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =====================================================
    // دریافت قیمت و اطلاعات سرویس‌ها
    // =====================================================

    async function loadServices() {
        try {
            setLoadingServices(true);
            setError("");

            const results = await Promise.all(
                SERVICES.map(async (item) => {
                    const data = await api(
                        `/services/${encodeURIComponent(item.type)}/price`
                    );

                    if (!data.success) {
                        throw new Error(
                            data.message ||
                            `سرویس ${item.type} پیدا نشد`
                        );
                    }

                    return data;
                })
            );

            const serviceMap = {};

            results.forEach((service) => {
                serviceMap[service.serviceType] = service;
            });

            setServices(serviceMap);
        } catch (err) {
            console.error("Load services error:", err);

            setError(
                err.message ||
                "خطا در دریافت اطلاعات سرویس‌ها"
            );
        } finally {
            setLoadingServices(false);
        }
    }

    useEffect(() => {
        loadServices();
    }, []);

    // =====================================================
    // تغییر نوع سرویس
    // =====================================================

    function handleServiceChange(e) {
        const newType = e.target.value;

        setServiceType(newType);
        setMessage("");
        setError("");

        // در سرویس بدون ایمیل، ایمیل قبلی پاک شود.
        if (newType === "apple_id_without_email") {
            setForm((prev) => ({
                ...prev,
                email: "",
            }));
        }
    }

    // =====================================================
    // تغییر فیلدها
    // =====================================================

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // =====================================================
    // ثبت سفارش
    // =====================================================

    async function submit(e) {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");
            setError("");

            // فقط فیلدهای دارای مقدار ارسال شوند.
            const details = {};

            Object.entries(form).forEach(([key, value]) => {
                if (
                    typeof value === "string" &&
                    value.trim() !== ""
                ) {
                    details[key] = value.trim();
                }
            });

            // برای سرویس بدون ایمیل، ایمیل اصلاً ارسال نشود.
            if (serviceType === "apple_id_without_email") {
                delete details.email;
            }

            // =================================================
            // ثبت سفارش
            // =================================================
            //
            // مهم:
            // نوع سرویس باید با serviceType ارسال شود.
            // قبلاً این مقدار داخل title ارسال می‌شد.
            //

            const result = await api(
                "/orders",
                {
                    method: "POST",
                    body: JSON.stringify({
                        serviceType,
                        details,
                    }),
                }
            );

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "خطا در ثبت سفارش"
                );
            }

            setMessage(
                "سفارش شما با موفقیت ثبت شد."
            );

            // پاک کردن فرم بعد از ثبت موفق
            setForm({
                ...EMPTY_FORM,
            });

        } catch (err) {
            console.error("Create order error:", err);

            setError(
                err.message ||
                "خطا در ثبت سفارش"
            );
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // وضعیت دریافت سرویس‌ها
    // =====================================================

    if (loadingServices) {
        return (
            <div className="p-8 text-center">
                در حال دریافت اطلاعات سرویس‌ها...
            </div>
        );
    }

    const selectedService = services[serviceType];

    const isWithEmail =
        serviceType === "apple_id_with_email";

    // =====================================================
    // فرم
    // =====================================================

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div
                className="
                    bg-white
                    rounded-2xl
                    shadow
                    p-6
                "
            >
                <h1
                    className="
                        text-2xl
                        font-bold
                        mb-6
                        text-center
                    "
                >
                    ساخت اپل آیدی
                </h1>

                {/* انتخاب نوع سرویس */}

                <div className="mb-6">
                    <label
                        className="
                            block
                            mb-2
                            font-semibold
                        "
                    >
                        نوع سرویس
                    </label>

                    <select
                        value={serviceType}
                        onChange={handleServiceChange}
                        className="
                            w-full
                            border
                            border-gray-300
                            rounded-xl
                            px-4
                            py-3
                            bg-white
                            focus:outline-none
                            focus:ring-2
                            focus:ring-blue-500
                        "
                    >
                        {SERVICES.map((item) => (
                            <option
                                key={item.type}
                                value={item.type}
                            >
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* اطلاعات سرویس */}

                {selectedService && (
                    <div
                        className="
                            bg-blue-50
                            border
                            border-blue-200
                            rounded-xl
                            p-4
                            mb-6
                        "
                    >
                        <div className="font-bold">
                            {selectedService.title}
                        </div>

                        <div
                            className="
                                mt-2
                                text-blue-700
                                font-semibold
                            "
                        >
                            قیمت:{" "}
                            {Number(
                                selectedService.basePrice
                            ).toLocaleString("fa-IR")}{" "}
                            تومان
                        </div>
                    </div>
                )}

                {/* پیام موفقیت */}

                {message && (
                    <div
                        className="
                            bg-green-100
                            text-green-700
                            p-3
                            rounded-lg
                            mb-4
                        "
                    >
                        {message}
                    </div>
                )}

                {/* پیام خطا */}

                {error && (
                    <div
                        className="
                            bg-red-100
                            text-red-700
                            p-3
                            rounded-lg
                            mb-4
                        "
                    >
                        {error}
                    </div>
                )}

                <form
                    onSubmit={submit}
                    className="space-y-4"
                >
                    {/* ایمیل فقط برای سرویس ایمیل‌دار */}

                    {isWithEmail && (
                        <Input
                            label="ایمیل"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="example@gmail.com"
                            required
                        />
                    )}

                    {/* نام */}

                    <Input
                        label="نام کامل"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        placeholder="به انگلیسی و با فاصله"
                    />

                    {/* شماره تماس */}

                    <Input
                        label="شماره تماس"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />

                    {/* رمز */}

                    <Input
                        label="رمز عبور پیشنهادی (اختیاری)"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="شامل حروف بزرگ، کوچک و اعداد"
                    />

                    {/* تاریخ تولد */}

                    <Input
                        label="تاریخ تولد (اختیاری)"
                        name="birthDate"
                        value={form.birthDate}
                        onChange={handleChange}
                        placeholder="مثلاً 2000/01/01"
                    />

                    {/* سوال امنیتی اول */}

                    <Input
                        label="پاسخ سوال امنیتی اول (اختیاری)"
                        name="security1"
                        value={form.security1}
                        onChange={handleChange}
                    />

                    {/* سوال امنیتی دوم */}

                    <Input
                        label="پاسخ سوال امنیتی دوم (اختیاری)"
                        name="security2"
                        value={form.security2}
                        onChange={handleChange}
                    />

                    {/* سوال امنیتی سوم */}

                    <Input
                        label="پاسخ سوال امنیتی سوم (اختیاری)"
                        name="security3"
                        value={form.security3}
                        onChange={handleChange}
                    />

                    {/* ثبت سفارش */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            py-3
                            rounded-xl
                            font-bold
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        {loading
                            ? "در حال ثبت..."
                            : "ثبت سفارش"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// =====================================================
// Input Component
// =====================================================

function Input({
    label,
    name,
    value,
    onChange,
    placeholder = "",
    type = "text",
    required = false,
}) {
    return (
        <div>
            <label
                className="
                    block
                    mb-1
                    font-semibold
                "
            >
                {label}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="
                    w-full
                    border
                    border-gray-300
                    rounded-xl
                    px-4
                    py-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                "
            />
        </div>
    );
}
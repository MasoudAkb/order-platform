const API_URL = import.meta.env.VITE_API_URL;

async function api(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    // پاسخ را ابتدا به صورت text می‌گیریم
    // تا اگر JSON نبود، خودمان خطای مناسب بدهیم.
    const raw = await response.text();

    let data;

    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        throw new Error(
            `API returned invalid response (${response.status})`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            `API Error (${response.status})`
        );
    }

    return data;
}

export default api;
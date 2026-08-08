import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({
    children,
    adminOnly = false
}) {
    const {
        token,
        user
    } = useAuth();

    const location = useLocation();

    // هنوز لاگین نکرده
    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // فقط ادمین
    if (
        adminOnly &&
        user?.role !== "admin"
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    // کاربر باید رمز خود را تغییر دهد
    if (
        user &&
        user.mustChangePassword === 1 &&
        location.pathname !== "/change-password"
    ) {
        return (
            <Navigate
                to="/change-password"
                replace
            />
        );
    }

    return children;
}
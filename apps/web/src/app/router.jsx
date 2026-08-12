import {
    createBrowserRouter
} from "react-router-dom";

import Layout from "./Layout";

import ProtectedRoute from "../features/auth/ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import OrderDetails from "../pages/OrderDetails";
import AppleId from "../features/orders/AppleId";

import Users from "../pages/Users";
import UserDetails from "../pages/UserDetails";
import Services from "../pages/Services";
import Wallet from "../pages/Wallet";

import UserOrders from "../pages/UserOrders";
import Orders from "../pages/Orders";

import Notifications from "../pages/Notifications";
import ServiceList from "../pages/ServiceList";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },

    {
        path: "/change-password",
        element: (
            <ProtectedRoute>
                <ChangePassword />
            </ProtectedRoute>
        )
    },

    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),

        children: [
            {
                index: true,
                element: <Home />
            },

            // =========================
            // USER
            // =========================

            {
                path: "orders",
                element: <UserOrders />
            },

            {
                path: "services",
                element: <ServiceList />
            },
            
            {
                path: "orders/:id",
                element: <OrderDetails />
            },

            {
                path: "apple-id",
                element: <AppleId />
            },

            // =========================
            // USER SERVICES
            // =========================

            {
                path: "services",
                element: <Services />
            },

            // =========================
            // USER NOTIFICATIONS
            // =========================

            {
                path: "notifications",
                element: <Notifications />
            },

            // =========================
            // ADMIN
            // =========================

            {
                path: "admin/orders",
                element: (
                    <ProtectedRoute adminOnly={true}>
                        <Orders />
                    </ProtectedRoute>
                )
            },

            {
                path: "users",
                element: (
                    <ProtectedRoute adminOnly={true}>
                        <Users />
                    </ProtectedRoute>
                )
            },

            {
                path: "users/:id",
                element: (
                    <ProtectedRoute adminOnly={true}>
                        <UserDetails />
                    </ProtectedRoute>
                )
            },

            {
                path: "wallet",
                element: (
                    <ProtectedRoute adminOnly={true}>
                        <Wallet />
                    </ProtectedRoute>
                )
            }
        ]
    }
]);

export default router;
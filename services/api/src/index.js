import { Hono } from "hono";
import ordersRoute from "./routes/orders";
// import admin from "./routes/admin";
import auth from "./routes/auth";
import adminUsers from "./routes/admin/users";
import password from "./routes/auth/password";
import adminWallet from "./routes/admin/wallet";
import userWallet from "./routes/wallet";
import adminOrders from "./routes/admin/orders";
import approve from "./routes/admin/order-approve";
import orderStatus from "./routes/admin/orders/status";
import reject from "./routes/admin/order-reject";
import complete from "./routes/admin/orders/complete";
import dashboard from "./routes/admin/dashboard";
import notifications from "./routes/notifications";
import services from "./routes/services";
import adminServices from "./routes/admin/services";
import appleId from "./routes/orders/apple-id";
import orderMessages from "./routes/orders/messages";
// import push from "./routes/push";
import pushSubscriptions from "./routes/push-subscriptions";
import { cors } from "hono/cors";
import me from "./routes/auth/me";
import history from "./routes/admin/orders/history";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173"
    ],
    allowHeaders: [
      "Content-Type",
      "Authorization"
    ],
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    credentials: true
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "order-platform-api",
  });
});


app.route("/orders", ordersRoute);
// app.route("/admin", admin);
app.route("/auth", auth);
app.route("/admin/users", adminUsers);
app.route("/auth/password", password);
app.route("/admin/wallet", adminWallet);
app.route("/wallet", userWallet);
app.route("/admin/orders", adminOrders);
app.route("/admin/orders", approve);
app.route("/admin/orders", orderStatus);
app.route("/admin/orders", reject);
app.route("/admin/orders", complete);
app.route("/admin/dashboard", dashboard);
app.route("/notifications", notifications);
app.route("/services", services);
app.route("/admin/services", adminServices);
app.route("/orders/apple-id", appleId);
app.route("/orders", orderMessages);
// app.route("/push", push);
app.route("/push-subscriptions", pushSubscriptions);
app.route("/auth/me", me);
app.route("/admin/orders", history);

export default app;
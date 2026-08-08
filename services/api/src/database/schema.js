import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";


export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  phone: text("phone")
    .notNull()
    .unique(),

  passwordHash: text("password_hash")
    .notNull(),

  role: text("role")
    .notNull()
    .default("customer"),

  balance: integer("balance")
    .notNull()
    .default(0),

  mustChangePassword: integer("must_change_password")
    .notNull()
    .default(1),

  createdAt: integer("created_at")
    .notNull(),
});


export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  title: text("title")
    .notNull(),

  description: text("description"),


  status: text("status")
    .notNull()
    .default("pending"),


  price: integer("price"),


  paymentStatus: text("payment_status")
    .notNull()
    .default("unpaid"),


  approvedAt: integer("approved_at"),


  completedAt: integer("completed_at"),


  rejectReason: text("reject_reason"),


  createdAt: integer("created_at")
    .notNull(),


  updatedAt: integer("updated_at")
    .notNull(),
});


export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),

  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),

  message: text("message")
    .notNull(),

  createdAt: integer("created_at")
    .notNull(),
});


export const walletTransactions = sqliteTable("wallet_transactions", {

  id: integer("id")
    .primaryKey({ autoIncrement: true }),


  userId: integer("user_id")
    .notNull()
    .references(() => users.id),


  amount: integer("amount")
    .notNull(),


  type: text("type")
    .notNull()
    .default("charge"),


  description: text("description"),


  createdAt: integer("created_at")
    .notNull()

});


export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),

  oldStatus: text("old_status")
    .notNull(),

  newStatus: text("new_status")
    .notNull(),

  changedBy: integer("changed_by")
    .notNull()
    .references(() => users.id),

  createdAt: integer("created_at")
    .notNull(),
});

export const notifications = sqliteTable("notifications", {

  id: integer("id")
    .primaryKey({ autoIncrement: true }),


  userId: integer("user_id")
    .notNull()
    .references(() => users.id),


  orderId: integer("order_id")
    .references(() => orders.id),


  title: text("title")
    .notNull(),


  body: text("body")
    .notNull(),


  type: text("type")
    .notNull(),


  isRead: integer("is_read")
    .notNull()
    .default(0),


  createdAt: integer("created_at")
    .notNull(),

});

export const orderDetails = sqliteTable("order_details", {

  id: integer("id")
    .primaryKey({ autoIncrement: true }),


  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),


  serviceType: text("service_type")
    .notNull(),


  data: text("data")
    .notNull(),


  createdAt: integer("created_at")
    .notNull(),

});



export const servicePrices = sqliteTable("service_prices", {

  id: integer("id")
    .primaryKey({ autoIncrement: true }),


  serviceType: text("service_type")
    .notNull()
    .unique(),


  title: text("title")
    .notNull(),


  basePrice: integer("base_price")
    .notNull(),


  updatedAt: integer("updated_at")
    .notNull()

});


export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {

    id: integer("id")
      .primaryKey({
        autoIncrement: true
      }),


    userId: integer("user_id")
      .notNull()
      .references(() => users.id),


    playerId: text("player_id")
      .notNull()
      .unique(),


    createdAt: integer("created_at")
      .notNull()

  }
);

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {

    id: integer("id")
      .primaryKey({
        autoIncrement: true
      }),


    userId: integer("user_id")
      .notNull()
      .references(() => users.id),


    tokenHash: text("token_hash")
      .notNull(),


    expiresAt: integer("expires_at")
      .notNull(),


    createdAt: integer("created_at")
      .notNull()

  }
);
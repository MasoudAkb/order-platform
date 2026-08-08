-- =========================================
-- USERS
-- مشتری‌ها و ادمین‌ها
-- =========================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    
    role TEXT NOT NULL DEFAULT 'customer'
        CHECK(role IN ('customer', 'admin')),

    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,

    password_hash TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- ORDERS
-- سفارش‌ها
-- =========================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY,

    customer_id TEXT NOT NULL,

    title TEXT NOT NULL,
    description TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(
            status IN (
                'pending',
                'processing',
                'completed',
                'cancelled'
            )
        ),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_orders_customer
ON orders(customer_id);


CREATE INDEX idx_orders_status
ON orders(status);



-- =========================================
-- ORDER MESSAGES
-- پیام بین مشتری و ادمین
-- =========================================

CREATE TABLE messages (

    id TEXT PRIMARY KEY,

    order_id TEXT NOT NULL,

    sender_id TEXT NOT NULL,

    sender_role TEXT NOT NULL
        CHECK(sender_role IN ('customer','admin')),

    message TEXT NOT NULL,


    is_read INTEGER DEFAULT 0,


    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,


    FOREIGN KEY(sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_messages_order
ON messages(order_id);



-- =========================================
-- NOTIFICATIONS
-- نوتیفیکیشن‌ها
-- =========================================

CREATE TABLE notifications (

    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    type TEXT NOT NULL,


    title TEXT NOT NULL,

    body TEXT NOT NULL,


    reference_id TEXT,


    is_read INTEGER DEFAULT 0,


    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


CREATE INDEX idx_notifications_user
ON notifications(user_id);



-- =========================================
-- SESSIONS
-- برای لاگین امن
-- =========================================

CREATE TABLE sessions (

    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,


    token_hash TEXT NOT NULL UNIQUE,


    expires_at DATETIME NOT NULL,


    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


CREATE INDEX idx_sessions_token
ON sessions(token_hash);



-- =========================================
-- AUDIT LOG
-- ثبت فعالیت‌ها
-- =========================================

CREATE TABLE audit_logs (

    id TEXT PRIMARY KEY,

    user_id TEXT,

    action TEXT NOT NULL,

    entity TEXT NOT NULL,

    entity_id TEXT,


    metadata TEXT,


    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);
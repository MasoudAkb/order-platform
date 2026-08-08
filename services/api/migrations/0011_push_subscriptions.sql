CREATE TABLE push_subscriptions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    player_id TEXT NOT NULL UNIQUE,

    created_at INTEGER NOT NULL,

    FOREIGN KEY(user_id) REFERENCES users(id)

);
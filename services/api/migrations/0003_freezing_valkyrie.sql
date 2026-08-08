PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_wallet_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`type` text DEFAULT 'charge' NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_wallet_transactions`("id", "user_id", "amount", "type", "description", "created_at") SELECT "id", "user_id", "amount", "type", "description", "created_at" FROM `wallet_transactions`;--> statement-breakpoint
DROP TABLE `wallet_transactions`;--> statement-breakpoint
ALTER TABLE `__new_wallet_transactions` RENAME TO `wallet_transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
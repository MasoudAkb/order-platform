CREATE TABLE `order_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`service_type` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_type` text NOT NULL,
	`base_price` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_prices_service_type_unique` ON `service_prices` (`service_type`);
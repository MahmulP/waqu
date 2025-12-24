CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`phone_number` varchar(50),
	`status` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_active` datetime,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`is_premium` boolean NOT NULL DEFAULT false,
	`premium_active_date` datetime,
	`premium_expiry_date` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
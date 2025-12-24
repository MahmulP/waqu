CREATE TABLE `auto_replies` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`session_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`match_type` varchar(20) NOT NULL,
	`trigger` text NOT NULL,
	`reply` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`case_sensitive` boolean NOT NULL DEFAULT false,
	`priority` varchar(10) NOT NULL DEFAULT 'normal',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auto_replies` ADD CONSTRAINT `auto_replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auto_replies` ADD CONSTRAINT `auto_replies_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE cascade ON UPDATE no action;
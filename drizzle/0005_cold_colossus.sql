CREATE TABLE `auto_reply_logs` (
	`id` varchar(36) NOT NULL,
	`auto_reply_id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`sender_number` varchar(50) NOT NULL,
	`trigger_message` text NOT NULL,
	`sent_reply` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auto_reply_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auto_replies` ADD `allowed_numbers` text;--> statement-breakpoint
ALTER TABLE `auto_reply_logs` ADD CONSTRAINT `auto_reply_logs_auto_reply_id_auto_replies_id_fk` FOREIGN KEY (`auto_reply_id`) REFERENCES `auto_replies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auto_reply_logs` ADD CONSTRAINT `auto_reply_logs_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auto_reply_logs` ADD CONSTRAINT `auto_reply_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
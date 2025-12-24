CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`from` varchar(100) NOT NULL,
	`to` varchar(100),
	`body` text,
	`type` varchar(50) NOT NULL DEFAULT 'chat',
	`has_media` boolean NOT NULL DEFAULT false,
	`timestamp` datetime NOT NULL,
	`is_from_me` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
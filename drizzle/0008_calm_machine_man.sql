CREATE TABLE `media_library` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`mimetype` varchar(100) NOT NULL,
	`file_size` varchar(20) NOT NULL,
	`file_type` varchar(20) NOT NULL,
	`file_path` text NOT NULL,
	`thumbnail_path` text,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `media_library` ADD CONSTRAINT `media_library_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
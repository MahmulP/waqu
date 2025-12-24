CREATE TABLE `bulk_message_recipients` (
	`id` varchar(36) NOT NULL,
	`bulk_message_id` varchar(36) NOT NULL,
	`contact_id` varchar(36) NOT NULL,
	`phone_number` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`sent_at` datetime,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulk_message_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulk_messages` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`group_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`media_url` text,
	`scheduled_at` datetime,
	`delay_between_messages` varchar(10) NOT NULL DEFAULT '5',
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`total_contacts` varchar(10) NOT NULL DEFAULT '0',
	`sent_count` varchar(10) NOT NULL DEFAULT '0',
	`failed_count` varchar(10) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulk_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_groups` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`group_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`phone_number` varchar(50) NOT NULL,
	`email` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bulk_message_recipients` ADD CONSTRAINT `bulk_message_recipients_bulk_message_id_bulk_messages_id_fk` FOREIGN KEY (`bulk_message_id`) REFERENCES `bulk_messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_message_recipients` ADD CONSTRAINT `bulk_message_recipients_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD CONSTRAINT `bulk_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD CONSTRAINT `bulk_messages_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD CONSTRAINT `bulk_messages_group_id_contact_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `contact_groups`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_groups` ADD CONSTRAINT `contact_groups_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_group_id_contact_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `contact_groups`(`id`) ON DELETE cascade ON UPDATE no action;
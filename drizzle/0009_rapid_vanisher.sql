ALTER TABLE `bulk_messages` RENAME COLUMN `media_url` TO `media_id`;--> statement-breakpoint
ALTER TABLE `bulk_messages` MODIFY COLUMN `media_id` varchar(36);--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD CONSTRAINT `bulk_messages_media_id_media_library_id_fk` FOREIGN KEY (`media_id`) REFERENCES `media_library`(`id`) ON DELETE set null ON UPDATE no action;
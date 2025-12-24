DROP TABLE `media_library`;--> statement-breakpoint
ALTER TABLE `bulk_messages` RENAME COLUMN `media_id` TO `media_url`;--> statement-breakpoint
ALTER TABLE `bulk_messages` DROP FOREIGN KEY `bulk_messages_media_id_media_library_id_fk`;
--> statement-breakpoint
ALTER TABLE `bulk_messages` MODIFY COLUMN `media_url` text;
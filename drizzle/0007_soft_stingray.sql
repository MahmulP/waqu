ALTER TABLE `bulk_messages` MODIFY COLUMN `status` varchar(20) NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD `started_at` datetime;--> statement-breakpoint
ALTER TABLE `bulk_messages` ADD `completed_at` datetime;
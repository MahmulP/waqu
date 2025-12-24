ALTER TABLE `auto_replies` ADD `use_ai` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `auto_replies` ADD `ai_context` text;--> statement-breakpoint
ALTER TABLE `auto_replies` ADD `ai_model` varchar(50) DEFAULT 'gpt-3.5-turbo';--> statement-breakpoint
ALTER TABLE `users` ADD `ai_api_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `ai_provider` varchar(50) DEFAULT 'openai';
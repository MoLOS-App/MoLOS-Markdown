CREATE TABLE `MoLOS-Markdown_quick_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`color` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`labels` text DEFAULT '[]' NOT NULL,
	`checklist` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quick_notes_user_id` ON `MoLOS-Markdown_quick_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_quick_notes_pinned` ON `MoLOS-Markdown_quick_notes` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `idx_quick_notes_archived` ON `MoLOS-Markdown_quick_notes` (`is_archived`);--> statement-breakpoint
CREATE INDEX `idx_quick_notes_updated_at` ON `MoLOS-Markdown_quick_notes` (`updated_at`);
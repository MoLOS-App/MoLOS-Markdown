ALTER TABLE `MoLOS-Markdown_quick_notes` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_quick_notes_position` ON `MoLOS-Markdown_quick_notes` (`position`);
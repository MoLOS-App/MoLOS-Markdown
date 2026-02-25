CREATE INDEX `idx_markdown_pages_user_id` ON `MoLOS-Markdown_pages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_markdown_pages_parent_page_id` ON `MoLOS-Markdown_pages` (`parent_page_id`);--> statement-breakpoint
CREATE INDEX `idx_markdown_pages_path` ON `MoLOS-Markdown_pages` (`path`);--> statement-breakpoint
CREATE INDEX `idx_markdown_pages_slug` ON `MoLOS-Markdown_pages` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_markdown_pages_updated_at` ON `MoLOS-Markdown_pages` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_markdown_versions_page_id` ON `MoLOS-Markdown_versions` (`page_id`);--> statement-breakpoint
CREATE INDEX `idx_markdown_versions_user_id` ON `MoLOS-Markdown_versions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_markdown_versions_version` ON `MoLOS-Markdown_versions` (`version`);
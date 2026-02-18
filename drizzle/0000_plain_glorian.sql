CREATE TABLE `MoLOS-Markdown_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`is_template` integer DEFAULT false,
	`parent_page_id` text,
	`path` text,
	`tags` text,
	`version` integer DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Markdown_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`page_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`change_description` text,
	`created_at` integer NOT NULL
);

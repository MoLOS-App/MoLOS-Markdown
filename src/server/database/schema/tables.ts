import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Markdown Pages - Hierarchical documentation pages
export const markdownPages = sqliteTable("MoLOS-Markdown_pages", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	slug: text("slug").notNull(),
	content: text("content").notNull(), // markdown
	isTemplate: integer("is_template", { mode: "boolean" }).default(false),
	parentPageId: text("parent_page_id"),
	path: text("path"), // e.g., "/docs/api/reference" - hierarchical path
	tags: text("tags"), // JSON array
	version: integer("version").default(1),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull()
});

// Markdown Page Versions - Version history
export const markdownVersions = sqliteTable("MoLOS-Markdown_versions", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	pageId: text("page_id").notNull(),
	version: integer("version").notNull(),
	content: text("content").notNull(),
	changeDescription: text("change_description"),
	createdAt: integer("created_at").notNull()
});

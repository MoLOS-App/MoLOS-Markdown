import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Markdown Pages - Hierarchical documentation pages
export const markdownPages = sqliteTable(
	"MoLOS-Markdown_pages",
	{
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
	},
	(table) => ({
		userIdIdx: index("idx_markdown_pages_user_id").on(table.userId),
		parentPageIdIdx: index("idx_markdown_pages_parent_page_id").on(table.parentPageId),
		pathIdx: index("idx_markdown_pages_path").on(table.path),
		slugIdx: index("idx_markdown_pages_slug").on(table.slug),
		updatedAtIdx: index("idx_markdown_pages_updated_at").on(table.updatedAt)
	})
);

// Markdown Page Versions - Version history
export const markdownVersions = sqliteTable(
	"MoLOS-Markdown_versions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").notNull(),
		pageId: text("page_id").notNull(),
		version: integer("version").notNull(),
		content: text("content").notNull(),
		changeDescription: text("change_description"),
		createdAt: integer("created_at").notNull()
	},
	(table) => ({
		pageIdIdx: index("idx_markdown_versions_page_id").on(table.pageId),
		userIdIdx: index("idx_markdown_versions_user_id").on(table.userId),
		versionIdx: index("idx_markdown_versions_version").on(table.version)
	})
);

// Quick Notes - Google Keep-style flat notes
export const markdownQuickNotes = sqliteTable(
	"MoLOS-Markdown_quick_notes",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").notNull(),
		title: text("title"),
		content: text("content").notNull(),
		color: text("color"),
		isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
		isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
		labels: text("labels").notNull().default("[]"),
		checklist: text("checklist").notNull().default("[]"),
		createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
		updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s','now'))`)
	},
	(table) => ({
		userIdIdx: index("idx_quick_notes_user_id").on(table.userId),
		pinnedIdx: index("idx_quick_notes_pinned").on(table.isPinned),
		archivedIdx: index("idx_quick_notes_archived").on(table.isArchived),
		updatedAtIdx: index("idx_quick_notes_updated_at").on(table.updatedAt)
	})
);

import { eq, and, desc, like, or } from "drizzle-orm";
import { BaseRepository } from "./base-repository.js";
import { markdownPages, markdownVersions } from "../db/schema";
import type {
	MarkdownPage,
	MarkdownVersion,
	CreateMarkdownPageInput,
	TreeNode
} from "../../models/index.js";

export class MarkdownRepository extends BaseRepository {
	private mapToPage(row: Record<string, unknown>): MarkdownPage {
		return {
			id: row.id as string,
			userId: row.userId as string,
			title: row.title as string,
			slug: row.slug as string,
			content: row.content as string,
			isTemplate: (row.isTemplate as number) === 1,
			parentPageId: row.parentPageId as string | undefined,
			path: row.path as string | undefined,
			tags: row.tags as string | undefined,
			version: row.version as number,
			createdAt: row.createdAt as number,
			updatedAt: row.updatedAt as number
		};
	}

	private mapToVersion(row: Record<string, unknown>): MarkdownVersion {
		return {
			id: row.id as string,
			userId: row.userId as string,
			pageId: row.pageId as string,
			version: row.version as number,
			content: row.content as string,
			changeDescription: row.changeDescription as string | undefined,
			createdAt: row.createdAt as number
		};
	}

	async getByUserId(userId: string): Promise<MarkdownPage[]> {
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(eq(markdownPages.userId, userId))
			.orderBy(desc(markdownPages.updatedAt));
		return result.map(this.mapToPage);
	}

	async search(userId: string, query: string, limit = 20): Promise<MarkdownPage[]> {
		const term = `%${query}%`;
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(
				and(
					eq(markdownPages.userId, userId),
					or(
						like(markdownPages.title, term),
						like(markdownPages.content, term)
					)
				)
			)
			.limit(limit);
		return result.map(this.mapToPage);
	}

	async getById(id: string, userId: string): Promise<MarkdownPage | null> {
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(and(eq(markdownPages.id, id), eq(markdownPages.userId, userId)))
			.limit(1);
		return result.length > 0 ? this.mapToPage(result[0]) : null;
	}

	async getBySlug(slug: string, userId: string): Promise<MarkdownPage | null> {
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(and(eq(markdownPages.slug, slug), eq(markdownPages.userId, userId)))
			.limit(1);
		return result.length > 0 ? this.mapToPage(result[0]) : null;
	}

	async getByPath(path: string, userId: string): Promise<MarkdownPage | null> {
		// First, try to find by exact path
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(and(eq(markdownPages.userId, userId), eq(markdownPages.path, path)))
			.limit(1);

		if (result.length > 0) {
			return this.mapToPage(result[0]);
		}

		// If not found, try to find by slug (for pages without explicit path)
		const slug = path.startsWith("/") ? path.slice(1) : path;
		const slugResult = await this.db
			.select()
			.from(markdownPages)
			.where(and(eq(markdownPages.userId, userId), eq(markdownPages.slug, slug)))
			.limit(1);

		return slugResult.length > 0 ? this.mapToPage(slugResult[0]) : null;
	}

	async getChildren(parentPath: string, userId: string): Promise<MarkdownPage[]> {
		// Get all pages whose path starts with parentPath + '/' but only immediate children
		const allPages = await this.getByUserId(userId);

		const parentPathNormalized = parentPath === "/" ? "" : parentPath;

		return allPages.filter(page => {
			const pagePath = page.path || "";
			if (pagePath === parentPathNormalized) return false;

			const relativePath = pagePath.startsWith(parentPathNormalized + "/")
				? pagePath.slice(parentPathNormalized.length + 1)
				: null;

			if (!relativePath) return false;
			// Only direct children (no additional slashes)
			return !relativePath.includes("/");
		});
	}

	async getTree(userId: string): Promise<TreeNode[]> {
		const allPages = await this.getByUserId(userId);

		const nodeMap = new Map<string, TreeNode>();
		const rootNodes: TreeNode[] = [];

		// Collect all unique paths (including intermediates)
		const allPaths = new Set<string>();

		for (const page of allPages) {
			const path = page.path || `/${page.slug}`;
			allPaths.add(path);

			// Add all parent paths
			const parts = path.split("/").filter(Boolean);
			for (let i = 1; i < parts.length; i++) {
				allPaths.add("/" + parts.slice(0, i).join("/"));
			}
		}

		// Create nodes for all paths
		for (const path of Array.from(allPaths).sort()) {
			// Check if this path has a real page
			const page = allPages.find(p => (p.path || `/${p.slug}`) === path);

			if (page) {
				// This is a real page node
				const hasChildren = Array.from(allPaths).some(other =>
					other !== path && other.startsWith(path + "/")
				);

				const node: TreeNode = {
					id: page.id,
					title: page.title,
					path,
					type: hasChildren ? "folder" : "page",
					slug: page.slug,
					children: []
				};

				nodeMap.set(path, node);
			} else {
				// This is an intermediate folder node
				const parts = path.split("/").filter(Boolean);
				const folderName = parts[parts.length - 1];

				const node: TreeNode = {
					id: `folder-${path}`,
					title: folderName
						.split(/[-_]/)
						.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
						.join(" "),
					path,
					type: "folder",
					slug: folderName,
					children: []
				};

				nodeMap.set(path, node);
			}
		}

		// Build hierarchy - all nodes are now in nodeMap
		for (const [path, node] of nodeMap) {
			const parts = path.split("/").filter(Boolean);

			if (parts.length === 0) continue; // Skip root

			if (parts.length === 1) {
				// This is a root level node
				rootNodes.push(node);
			} else {
				// This is a nested node, find its parent
				const parentPath = "/" + parts.slice(0, -1).join("/");
				const parent = nodeMap.get(parentPath);

				if (parent) {
					if (!parent.children) {
						parent.children = [];
					}
					// Avoid duplicates
					if (!parent.children.some(c => c.path === path)) {
						parent.children.push(node);
					}
					// Ensure parent is marked as folder
					parent.type = "folder";
				} else {
					// Parent doesn't exist (shouldn't happen), add to root
					rootNodes.push(node);
				}
			}
		}

		// Sort: folders first, then alphabetically
		const sortNodes = (nodes: TreeNode[]) => {
			nodes.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === "folder" ? -1 : 1;
				}
				return a.title.localeCompare(b.title);
			});
			nodes.forEach(node => node.children && sortNodes(node.children));
		};

		sortNodes(rootNodes);
		return rootNodes;
	}

	async movePage(id: string, newPath: string, userId: string): Promise<MarkdownPage | null> {
		const page = await this.getById(id, userId);
		if (!page) return null;

		const oldPath = page.path || `/${page.slug}`;

		// Update the page's path
		await this.db
			.update(markdownPages)
			.set({ path: newPath, updatedAt: Math.floor(Date.now() / 1000) })
			.where(and(eq(markdownPages.id, id), eq(markdownPages.userId, userId)));

		// Update all children paths recursively
		const allPages = await this.getByUserId(userId);
		const children = allPages.filter(p =>
			p.path && p.path.startsWith(oldPath + "/") && p.id !== id
		);

		for (const child of children) {
			if (child.path) {
				const relativePath = child.path.slice(oldPath.length);
				const newChildPath = newPath + relativePath;
				await this.db
					.update(markdownPages)
					.set({ path: newChildPath, updatedAt: Math.floor(Date.now() / 1000) })
					.where(eq(markdownPages.id, child.id));
			}
		}

		return this.getById(id, userId);
	}

	async getTemplates(userId: string): Promise<MarkdownPage[]> {
		const result = await this.db
			.select()
			.from(markdownPages)
			.where(
				and(
					eq(markdownPages.userId, userId),
					eq(markdownPages.isTemplate, 1)
				)
			);
		return result.map(this.mapToPage);
	}

	async getVersions(pageId: string, userId: string): Promise<MarkdownVersion[]> {
		const result = await this.db
			.select()
			.from(markdownVersions)
			.where(eq(markdownVersions.pageId, pageId))
			.orderBy(desc(markdownVersions.version));
		return result.map(this.mapToVersion);
	}

	private async generatePath(data: CreateMarkdownPageInput, userId: string): Promise<string> {
		const slug = data.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		if (!data.parentPageId) {
			return `/${slug}`;
		}

		// Get parent path
		const parent = await this.getById(data.parentPageId, userId);
		if (parent && parent.path) {
			return `${parent.path}/${slug}`;
		}

		return `/${slug}`;
	}

	async create(data: CreateMarkdownPageInput, userId: string): Promise<MarkdownPage> {
		// Validate required fields
		if (!data.title) {
			throw new Error("Title is required to create a markdown page");
		}
		// Allow empty content, but require the field to be provided
		if (data.content === undefined) {
			throw new Error("Content is required to create a markdown page");
		}

		const now = Math.floor(Date.now() / 1000);
		const id = `MDPAGE-${Date.now()}`;

		// Generate slug from title
		const slug = data.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		// Generate path
		const path = data.path || await this.generatePath(data, userId);

		await this.db.insert(markdownPages).values({
			id,
			userId,
			title: data.title,
			slug,
			content: data.content,
			isTemplate: false,
			parentPageId: data.parentPageId ?? null,
			path,
			tags: data.tags ? JSON.stringify(data.tags) : null,
			version: 1,
			createdAt: now,
			updatedAt: now
		});

		// Create initial version
		await this.db.insert(markdownVersions).values({
			id: `MDVER-${Date.now()}`,
			userId,
			pageId: id,
			version: 1,
			content: data.content,
			changeDescription: "Initial version",
			createdAt: now
		});

		return this.getById(id, userId) as Promise<MarkdownPage>;
	}

	async update(id: string, userId: string, data: Partial<MarkdownPage & { changeDescription?: string }>): Promise<MarkdownPage> {
		const now = Math.floor(Date.now() / 1000);
		const updateData: Record<string, unknown> = { updatedAt: now };

		if (data.title !== undefined) updateData.title = data.title;
		if (data.content !== undefined) {
			updateData.content = data.content;
			// Increment version
			const page = await this.getById(id, userId);
			if (page) {
				updateData.version = page.version + 1;
			}
		}
		if (data.tags !== undefined) {
			// Convert tags array to JSON string
			updateData.tags = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null;
		}
		if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate ? 1 : 0;
		if (data.path !== undefined) updateData.path = data.path;

		await this.db
			.update(markdownPages)
			.set(updateData)
			.where(and(eq(markdownPages.id, id), eq(markdownPages.userId, userId)));

		// Create version record if content changed
		if (data.content !== undefined) {
			const page = await this.getById(id, userId);
			if (page) {
				await this.db.insert(markdownVersions).values({
					id: `MDVER-${Date.now()}`,
					userId,
					pageId: id,
					version: page.version,
					content: data.content,
					changeDescription: data.changeDescription ?? null,
					createdAt: now
				});
			}
		}

		return this.getById(id, userId) as Promise<MarkdownPage>;
	}

	async delete(id: string, userId: string): Promise<boolean> {
		// Get page to find children
		const page = await this.getById(id, userId);
		if (!page) return false;

		const pagePath = page.path || `/${page.slug}`;

		// Delete all children recursively
		const allPages = await this.getByUserId(userId);
		const descendants = allPages.filter(p =>
			p.path && p.path.startsWith(pagePath + "/")
		);

		for (const descendant of descendants) {
			await this.db
				.delete(markdownPages)
				.where(and(eq(markdownPages.id, descendant.id), eq(markdownPages.userId, userId)));
		}

		// Delete the page itself
		const result = await this.db
			.delete(markdownPages)
			.where(and(eq(markdownPages.id, id), eq(markdownPages.userId, userId)));

		return result.rowsAffected > 0;
	}
}

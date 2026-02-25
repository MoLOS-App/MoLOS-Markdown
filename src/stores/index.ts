import { writable, derived } from 'svelte/store';
import type { MarkdownPage, TreeNode } from '../models/index.js';

export const selectedPageId = writable<string | null>(null);
export const selectedPage = writable<MarkdownPage | null>(null);
export const expandedNodes = writable<Set<string>>(new Set());
export const searchQuery = writable<string>('');
export const tagFilter = writable<string>('all');
export const pages = writable<Map<string, MarkdownPage>>(new Map());
export const tree = writable<TreeNode[]>([]);
export const templates = writable<MarkdownPage[]>([]);
export const showCreateDialog = writable<boolean>(false);
export const showEditDialog = writable<boolean>(false);
export const isEditing = writable<boolean>(false);
export const editContent = writable<string>('');
export const showDeleteDialog = writable<boolean>(false);
export const pageToDelete = writable<MarkdownPage | null>(null);

const pagesArray = derived(pages, ($pages) => Array.from($pages.values()));

export const filteredPages = derived(
	[pagesArray, searchQuery, tagFilter],
	([$pages, $searchQuery, $tagFilter]) => {
		let result = $pages;

		if ($searchQuery) {
			const query = $searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.title.toLowerCase().includes(query) ||
					p.content.toLowerCase().includes(query)
			);
		}

		if ($tagFilter !== 'all') {
			result = result.filter((p) => {
				if (!p.tags) return false;
				try {
					const tags = JSON.parse(p.tags);
					return tags.includes($tagFilter);
				} catch {
					return false;
				}
			});
		}

		return result;
	}
);

export const allTags = derived(pagesArray, ($pages) => {
	const tagSet = new Set<string>();
	for (const page of $pages) {
		if (page.tags) {
			try {
				const tags = JSON.parse(page.tags);
				tags.forEach((tag: string) => tagSet.add(tag));
			} catch {
				continue;
			}
		}
	}
	return Array.from(tagSet).sort();
});

export function toggleExpanded(path: string): void {
	expandedNodes.update((nodes) => {
		const newSet = new Set(nodes);
		if (newSet.has(path)) {
			newSet.delete(path);
		} else {
			newSet.add(path);
		}
		return newSet;
	});
}

export function expandAll(paths: string[]): void {
	expandedNodes.update(() => new Set(paths));
}

export function collapseAll(): void {
	expandedNodes.update(() => new Set());
}

export function selectPage(page: MarkdownPage): void {
	selectedPageId.set(page.id);
	selectedPage.set(page);
	editContent.set(page.content);
	isEditing.set(false);
}

export function clearSelectedPage(): void {
	selectedPageId.set(null);
	selectedPage.set(null);
	editContent.set('');
	isEditing.set(false);
}

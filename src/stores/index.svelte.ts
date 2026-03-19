import type { MarkdownPage, TreeNode } from '../models/index.js';

// State containers
let pageId = $state<string | null>(null);
let page = $state<MarkdownPage | null>(null);
let expanded = $state<Set<string>>(new Set());
let query = $state<string>('');
let tag = $state<string>('all');
let pagesMap = $state<Map<string, MarkdownPage>>(new Map());
let treeNodes = $state<TreeNode[]>([]);
let templatePages = $state<MarkdownPage[]>([]);
let createOpen = $state<boolean>(false);
let editOpen = $state<boolean>(false);
let editing = $state<boolean>(false);
let editContentValue = $state<string>('');
let deleteOpen = $state<boolean>(false);
let pageToDelete = $state<MarkdownPage | null>(null);

// Derived state
const pagesArray = $derived(Array.from(pagesMap.values()));

const filtered = $derived.by(() => {
	let result = pagesArray;

	if (query) {
		const searchLower = query.toLowerCase();
		result = result.filter(
			(p) =>
				p.title.toLowerCase().includes(searchLower) ||
				p.content.toLowerCase().includes(searchLower)
		);
	}

	if (tag !== 'all') {
		result = result.filter((p) => {
			if (!p.tags) return false;
			try {
				const tags = JSON.parse(p.tags);
				return tags.includes(tag);
			} catch {
				return false;
			}
		});
	}

	return result;
});

const allTags = $derived.by(() => {
	const tagSet = new Set<string>();
	for (const p of pagesArray) {
		if (p.tags) {
			try {
				const tags = JSON.parse(p.tags);
				tags.forEach((t: string) => tagSet.add(t));
			} catch {
				continue;
			}
		}
	}
	return Array.from(tagSet).sort();
});

// Export with getters (safe pattern for Svelte 5)
export const pagesState = {
	get selectedPageId() { return pageId; },
	set selectedPageId(value: string | null) { pageId = value; },
	get selectedPage() { return page; },
	set selectedPage(value: MarkdownPage | null) { page = value; },
	get expandedNodes() { return expanded; },
	set expandedNodes(value: Set<string>) { expanded = value; },
	get searchQuery() { return query; },
	set searchQuery(value: string) { query = value; },
	get tagFilter() { return tag; },
	set tagFilter(value: string) { tag = value; },
	get pages() { return pagesMap; },
	set pages(value: Map<string, MarkdownPage>) { pagesMap = value; },
	get tree() { return treeNodes; },
	set tree(value: TreeNode[]) { treeNodes = value; },
	get templates() { return templatePages; },
	set templates(value: MarkdownPage[]) { templatePages = value; },
	get showCreateDialog() { return createOpen; },
	set showCreateDialog(value: boolean) { createOpen = value; },
	get showEditDialog() { return editOpen; },
	set showEditDialog(value: boolean) { editOpen = value; },
	get isEditing() { return editing; },
	set isEditing(value: boolean) { editing = value; },
	get editContent() { return editContentValue; },
	set editContent(value: string) { editContentValue = value; },
	get showDeleteDialog() { return deleteOpen; },
	set showDeleteDialog(value: boolean) { deleteOpen = value; },
	get pageToDelete() { return pageToDelete; },
	set pageToDelete(value: MarkdownPage | null) { pageToDelete = value; },
	get filteredPages() { return filtered; },
	get allTags() { return allTags; },
	get pagesArray() { return pagesArray; }
};

// Actions
export function toggleExpanded(path: string): void {
	const newSet = new Set(expanded);
	if (newSet.has(path)) {
		newSet.delete(path);
	} else {
		newSet.add(path);
	}
	expanded = newSet;
}

export function expandAll(paths: string[]): void {
	expanded = new Set(paths);
}

export function collapseAll(): void {
	expanded = new Set();
}

export function selectPage(p: MarkdownPage): void {
	pageId = p.id;
	page = p;
	editContentValue = p.content;
	editing = false;
}

export function clearSelectedPage(): void {
	pageId = null;
	page = null;
	editContentValue = '';
	editing = false;
}

// Legacy store exports for backward compatibility
function createLegacyStore<T>(getter: () => T, setter?: (value: T) => void) {
	return {
		subscribe: (fn: (value: T) => void) => {
			fn(getter());
			return () => {};
		},
		...(setter ? { set: setter, update: (fn: (value: T) => T) => setter(fn(getter())) } : {})
	};
}

export const selectedPageId = createLegacyStore(
	() => pageId,
	(value) => { pageId = value; }
);

export const selectedPage = createLegacyStore(
	() => page,
	(value) => { page = value; }
);

export const expandedNodes = createLegacyStore(
	() => expanded,
	(value) => { expanded = value; }
);

export const searchQuery = createLegacyStore(
	() => query,
	(value) => { query = value; }
);

export const tagFilter = createLegacyStore(
	() => tag,
	(value) => { tag = value; }
);

export const pages = createLegacyStore(
	() => pagesMap,
	(value) => { pagesMap = value; }
);

export const tree = createLegacyStore(
	() => treeNodes,
	(value) => { treeNodes = value; }
);

export const templates = createLegacyStore(
	() => templatePages,
	(value) => { templatePages = value; }
);

export const showCreateDialog = createLegacyStore(
	() => createOpen,
	(value) => { createOpen = value; }
);

export const showEditDialog = createLegacyStore(
	() => editOpen,
	(value) => { editOpen = value; }
);

export const isEditing = createLegacyStore(
	() => editing,
	(value) => { editing = value; }
);

export const editContent = createLegacyStore(
	() => editContentValue,
	(value) => { editContentValue = value; }
);

export const showDeleteDialog = createLegacyStore(
	() => deleteOpen,
	(value) => { deleteOpen = value; }
);

export const pageToDeleteStore = createLegacyStore(
	() => pageToDelete,
	(value) => { pageToDelete = value; }
);

export const filteredPages = {
	subscribe: (fn: (value: MarkdownPage[]) => void) => { fn(filtered); return () => {}; }
};

export const allTagsStore = {
	subscribe: (fn: (value: string[]) => void) => { fn(allTags); return () => {}; }
};

// Re-export quick-notes
export * from './quick-notes.svelte.js';

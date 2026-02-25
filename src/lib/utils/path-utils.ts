import type { MarkdownPage, TreeNode } from '../../models/index.js';

export function buildFullPath(pathPrefix: string, slug: string): string {
	const prefix = pathPrefix || '';
	const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
	return slug ? `${base}/${slug}` : base;
}

export function filterPathSuggestions(allPaths: string[], input: string): string[] {
	if (!input) {
		return allPaths.slice(0, 8);
	}
	const inputLower = input.toLowerCase();
	return allPaths
		.filter((path) => path.toLowerCase().includes(inputLower) || inputLower.includes(path.toLowerCase()))
		.slice(0, 8);
}

export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

export function getAllParentDirs(existingPaths: string[]): string[] {
	const parentDirs = new Set<string>(['/']);
	for (const path of existingPaths) {
		const parts = path.split('/').filter(Boolean);
		for (let i = 1; i <= parts.length; i++) {
			parentDirs.add('/' + parts.slice(0, i).join('/'));
		}
	}
	return Array.from(parentDirs).sort();
}

export function addTag(tags: string[], newTag: string): string[] {
	if (newTag.trim() && !tags.includes(newTag.trim())) {
		return [...tags, newTag.trim()];
	}
	return tags;
}

export function removeTag(tags: string[], tagToRemove: string): string[] {
	return tags.filter((t) => t !== tagToRemove);
}

export function parseTags(tagsString: string | undefined | null): string[] {
	if (!tagsString) return [];
	try {
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function stringifyTags(tags: string[]): string | null {
	if (!tags || tags.length === 0) return null;
	return JSON.stringify(tags);
}

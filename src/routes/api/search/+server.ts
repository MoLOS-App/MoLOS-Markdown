import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import type { SearchResult } from '@molos/core/types/search';
import { MarkdownRepository } from '../../../server/repositories/markdown-repository.js';
import { db } from '$lib/server/db';

const SearchSchema = z.object({
	q: z.string().min(1),
	limit: z.coerce.number().int().min(1).max(100).optional()
});

const moduleId = 'MoLOS-Markdown';
const moduleName = 'Markdown';

const buildSnippet = (value?: string | null) => {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (trimmed.length <= 140) return trimmed;
	return `${trimmed.slice(0, 140).trim()}...`;
};

const toMs = (value?: number | null) => (value ? value * 1000 : undefined);

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const parsed = SearchSchema.safeParse({
		q: url.searchParams.get('q'),
		limit: url.searchParams.get('limit') ?? undefined
	});

	if (!parsed.success) {
		throw error(400, parsed.error.issues[0]?.message ?? 'Invalid query');
	}

	const { q, limit } = parsed.data;
	const perTypeLimit = Math.min(20, limit ?? 20);

	const markdownRepo = new MarkdownRepository(db);
	const pages = await markdownRepo.search(userId, q, perTypeLimit);

	const results: SearchResult[] = pages.map((page) => ({
		moduleId,
		moduleName,
		entityType: 'page',
		entityId: page.id,
		title: page.title,
		snippet: buildSnippet(page.content),
		href: `/ui/MoLOS-Markdown?page=${page.id}`,
		updatedAt: toMs(page.updatedAt)
	}));

	return json({ query: q, results, total: results.length });
};

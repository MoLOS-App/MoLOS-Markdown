import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MarkdownRepository } from '../../../server/repositories/index.js';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new MarkdownRepository(db);
	const pages = await repo.getByUserId(userId);

	const exportData = {
		version: '1.0',
		exportedAt: new Date().toISOString(),
		pages: pages.map((page) => ({
			id: page.id,
			title: page.title,
			slug: page.slug,
			content: page.content,
			path: page.path,
			tags: page.tags ? JSON.parse(page.tags) : [],
			createdAt: page.createdAt,
			updatedAt: page.updatedAt
		}))
	};

	return new Response(JSON.stringify(exportData, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="molos-markdown-export-${Date.now()}.json"`
		}
	});
};

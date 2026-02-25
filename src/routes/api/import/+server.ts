import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { MarkdownRepository } from '../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const ImportDataSchema = z.object({
	version: z.string(),
	pages: z.array(
		z.object({
			title: z.string(),
			slug: z.string().optional(),
			content: z.string().default(''),
			path: z.string().optional(),
			tags: z.array(z.string()).optional(),
			createdAt: z.number().optional(),
			updatedAt: z.number().optional()
		})
	)
});

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	try {
		const text = await request.text();
		const jsonData = JSON.parse(text);
		const result = ImportDataSchema.safeParse(jsonData);

		if (!result.success) {
			throw error(400, `Invalid import data: ${result.error.issues[0]?.message}`);
		}

		const { pages } = result.data;
		const repo = new MarkdownRepository(db);

		const createdPages = [];

		for (const pageData of pages) {
			try {
				const page = await repo.create(
					{
						title: pageData.title,
						content: pageData.content,
						path: pageData.path,
						tags: pageData.tags
					},
					userId
				);
				createdPages.push(page);
			} catch (e) {
				console.error(`Failed to import page "${pageData.title}":`, e);
			}
		}

		return json({
			success: true,
			imported: createdPages.length,
			total: pages.length,
			pages: createdPages
		});
	} catch (e) {
		if (e instanceof SyntaxError) {
			throw error(400, 'Invalid JSON format');
		}
		throw error(500, 'Import failed');
	}
};

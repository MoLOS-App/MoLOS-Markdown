import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { MarkdownRepository } from '../../../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const RestoreVersionSchema = z.object({
	version: z.coerce.number().int().min(1)
});

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const page = await new MarkdownRepository(db).getById(params.id, userId);
	if (!page) {
		throw error(404, 'Page not found');
	}

	const body = await request.json();
	const result = RestoreVersionSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0]?.message ?? 'Invalid version number');
	}

	const { version } = result.data;

	const restoredPage = await new MarkdownRepository(db).restoreVersion(params.id, version, userId);

	if (!restoredPage) {
		throw error(404, 'Version not found');
	}

	return json(restoredPage);
};

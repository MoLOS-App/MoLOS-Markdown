import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { QuickNotesRepository } from '../../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const ReorderSchema = z.object({
	sourceId: z.string().min(1),
	targetId: z.string().min(1)
});

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const result = ReorderSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const { sourceId, targetId } = result.data;

	const repo = new QuickNotesRepository(db);
	const note = await repo.reorder(sourceId, targetId, userId);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { QuickNotesRepository } from '../../../../server/repositories/index.js';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new QuickNotesRepository(db);
	const note = await repo.togglePin(params.id, userId);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

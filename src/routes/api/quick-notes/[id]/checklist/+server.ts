import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { z } from 'zod';
import { QuickNotesRepository } from '../../../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const ChecklistItemSchema = z.object({
	id: z.string().optional(),
	text: z.string().min(1, 'Checklist item text is required'),
	isChecked: z.boolean(),
	sortOrder: z.number().optional()
});

const UpdateChecklistSchema = z.object({
	checklist: z.array(ChecklistItemSchema)
});

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const result = UpdateChecklistSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new QuickNotesRepository(db);
	const note = await repo.updateChecklist(params.id, userId, result.data.checklist);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

export const POST: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const { itemId } = await params;
	const repo = new QuickNotesRepository(db);
	const note = await repo.toggleChecklistItem(params.id, userId, itemId);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

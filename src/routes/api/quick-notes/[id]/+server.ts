import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { QuickNotesRepository } from '../../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const ChecklistItemSchema = z.object({
	id: z.string().optional(),
	text: z.string().min(1, 'Checklist item text is required'),
	isChecked: z.boolean(),
	sortOrder: z.number().optional()
});

const UpdateNoteSchema = z.object({
	title: z.string().optional(),
	content: z.string().optional(),
	color: z.string().optional(),
	labels: z.array(z.string()).optional(),
	checklist: z.array(ChecklistItemSchema).optional(),
	isPinned: z.boolean().optional(),
	isArchived: z.boolean().optional()
});

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const { id } = params;
	if (!id) throw error(400, 'Note id is required');

	const body = await request.json();
	const result = UpdateNoteSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new QuickNotesRepository(db);
	const note = await repo.update(id, userId, result.data);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const { id } = params;
	if (!id) throw error(400, 'Note id is required');

	const repo = new QuickNotesRepository(db);
	const deleted = await repo.delete(id, userId);

	if (!deleted) throw error(404, 'Note not found');

	return json({ success: true });
};

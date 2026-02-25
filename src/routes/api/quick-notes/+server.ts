import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { QuickNotesRepository } from '../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const ChecklistItemSchema = z.object({
	id: z.string().optional(),
	text: z.string().min(1, 'Checklist item text is required'),
	isChecked: z.boolean(),
	sortOrder: z.number().optional()
});

 const CreateNoteSchema = z.object({
	title: z.string().optional(),
	content: z.string().min(1, 'Content is required'),
	color: z.string().optional(),
	labels: z.array(z.string()).optional(),
	checklist: z.array(ChecklistItemSchema).optional()
});

const UpdateNoteSchema = CreateNoteSchema.partial().extend({
	id: z.string().min(1, 'Note id is required'),
	isPinned: z.boolean().optional(),
	isArchived: z.boolean().optional()
});

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new QuickNotesRepository(db);
	const id = url.searchParams.get('id');
	const includeArchived = url.searchParams.get('archived') === 'true';
	const searchQuery = url.searchParams.get('q');

	if (id) {
		const note = await repo.getById(id, userId);
		if (!note) throw error(404, 'Note not found');
		return json(note);
	}

	if (searchQuery) {
		const notes = await repo.searchByUserId(userId, searchQuery, includeArchived);
		return json(notes);
	}

	const notes = await repo.listByUserId(userId, {
		includeArchived: includeArchived || false,
		pinnedFirst: !includeArchived
	});

	return json(notes);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const result = CreateNoteSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new QuickNotesRepository(db);
	const note = await repo.create({
		userId,
		...result.data
	});

	return json(note, { status: 201 });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const result = UpdateNoteSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const { id, ...updates } = result.data;
	const repo = new QuickNotesRepository(db);
	const note = await repo.update(id, userId, updates);

	if (!note) throw error(404, 'Note not found');

	return json(note);
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const { id } = await request.json();
	if (!id) throw error(400, 'Note id is required');

	const repo = new QuickNotesRepository(db);
	const deleted = await repo.delete(id, userId);

	if (!deleted) throw error(404, 'Note not found');

	return json({ success: true });
};

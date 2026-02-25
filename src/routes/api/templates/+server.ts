import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { MarkdownRepository } from '../../../server/repositories/index.js';
import { db } from '$lib/server/db';

const CreateTemplateSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().default(''),
	path: z.string().optional(),
	tags: z.array(z.string()).optional()
});

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const result = CreateTemplateSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new MarkdownRepository(db);
	const templateData = {
		...result.data,
		isTemplate: true
	};
	const template = await repo.create(templateData as any, userId);

	return json(template, { status: 201 });
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new MarkdownRepository(db);
	const templates = await repo.getTemplates(userId);

	return json(templates);
};

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { MarkdownRepository } from "../../../../repositories";
import { db } from "$lib/server/db";

const UpdateMarkdownPageSchema = z.object({
	title: z.string().optional(),
	content: z.string().optional(),
	tags: z.array(z.string()).optional(),
	path: z.string().optional(),
	isTemplate: z.boolean().optional()
});

export const GET: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const repo = new MarkdownRepository(db);
	const page = await repo.getById(params.id, userId);

	if (!page) {
		throw error(404, "Page not found");
	}

	return json(page);
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const body = await request.json();
	const result = UpdateMarkdownPageSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new MarkdownRepository(db);
	const page = await repo.update(params.id, userId, result.data);

	return json(page);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const repo = new MarkdownRepository(db);
	await repo.delete(params.id, userId);

	return json({ success: true });
};

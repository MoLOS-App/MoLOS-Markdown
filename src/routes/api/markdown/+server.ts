import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { MarkdownRepository } from "../../../server/repositories/index.js";
import { db } from "$lib/server/db";

const CreateMarkdownPageSchema = z.object({
	title: z.string().min(1, "Title is required"),
	content: z.string().optional().default(""),
	path: z.string().optional(),
	parentPageId: z.string().optional(),
	tags: z.array(z.string()).optional()
});

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const repo = new MarkdownRepository(db);
	const query = url.searchParams.get("q");
	const templates = url.searchParams.get("templates");
	const tree = url.searchParams.get("tree");
	const path = url.searchParams.get("path");

	if (tree === "true") {
		const treeData = await repo.getTree(userId);
		return json(treeData);
	}

	if (path) {
		const page = await repo.getByPath(path, userId);
		if (!page) {
			throw error(404, "Page not found");
		}
		return json(page);
	}

	let pages;

	if (query) {
		pages = await repo.search(userId, query);
	} else if (templates === "true") {
		pages = await repo.getTemplates(userId);
	} else {
		pages = await repo.getByUserId(userId);
	}

	return json(pages);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const body = await request.json();
	const result = CreateMarkdownPageSchema.safeParse(body);

	if (!result.success) {
		throw error(400, result.error.issues[0].message);
	}

	const repo = new MarkdownRepository(db);
	const page = await repo.create(result.data, userId);

	return json(page, { status: 201 });
};

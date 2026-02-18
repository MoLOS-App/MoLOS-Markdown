import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { MarkdownRepository } from "../../../../../repositories";
import { db } from "$lib/server/db";

export const GET: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, "Unauthorized");

	const repo = new MarkdownRepository(db);
	const page = await repo.getById(params.id, userId);

	if (!page) {
		throw error(404, "Page not found");
	}

	const versions = await repo.getVersions(params.id, userId);

	return json(versions);
};

import type { PageServerLoad } from "./$types";
import { MarkdownRepository } from "../../repositories";
import { db } from "$lib/server/db";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { pages: [], templates: [], tree: [] };
	}

	const markdownRepo = new MarkdownRepository(db);

	const pages = await markdownRepo.getByUserId(locals.user.id);
	const templates = await markdownRepo.getTemplates(locals.user.id);
	const tree = await markdownRepo.getTree(locals.user.id);

	return { pages, templates, tree };
};

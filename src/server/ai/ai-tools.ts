import { MarkdownRepository } from '../repositories/markdown-repository.js';

// Module category for tool filtering
const MODULE_CATEGORY = 'markdown';

// Tool tags for categorization
const TOOL_TAGS = {
	READ: 'read',
	WRITE: 'write',
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete',
	SEARCH: 'search',
	BULK: 'bulk',
	SINGLE: 'single',
	QUERY: 'query'
} as const;

export function getAiTools(userId: string): ToolDefinition[] {
	const markdownRepo = new MarkdownRepository();

	return [
		// Pages
		{
			name: 'get_markdown_pages',
			description: 'Retrieve markdown pages for the user.',
			parameters: {
				type: 'object',
				properties: {
					limit: { type: 'number', default: 10 }
				}
			} as const,
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.READ, TOOL_TAGS.QUERY],
				priority: 75,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				return await markdownRepo.getByUserId(userId, params.limit as number);
			}
		},
		{
			name: 'get_markdown_page',
			description: 'Get a specific markdown page by ID.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'The page ID' }
				},
				required: ['id']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.READ, TOOL_TAGS.SINGLE],
				priority: 70,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				const page = await markdownRepo.getById(params.id as string, userId);
				if (!page) {
					return { error: 'Page not found' };
				}
				return page;
			}
		},
		{
			name: 'search_markdown_pages',
			description: 'Search markdown pages by title or content.',
			parameters: {
				type: 'object',
				properties: {
					query: { type: 'string', description: 'Search query' },
					limit: { type: 'number', default: 10 }
				},
				required: ['query']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.READ, TOOL_TAGS.SEARCH],
				priority: 70,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				return await markdownRepo.search(userId, params.query as string, params.limit as number);
			}
		},
		{
			name: 'create_markdown_page',
			description: 'Create a new markdown page.',
			parameters: {
				type: 'object',
				properties: {
					title: { type: 'string', description: 'Page title' },
					content: { type: 'string', description: 'Markdown content', default: '' },
					path: { type: 'string', description: 'Hierarchical path (e.g., /docs/api)' },
					tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the page' }
				},
				required: ['title']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.WRITE, TOOL_TAGS.CREATE],
				priority: 65,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				try {
					const page = await markdownRepo.create(
						{
							title: params.title as string,
							content: (params.content as string) || '',
							path: params.path as string | undefined,
							tags: params.tags as string[] | undefined
						},
						userId
					);
					return page;
				} catch (error) {
					return {
						error: error instanceof Error ? error.message : 'Failed to create page'
					};
				}
			}
		},
		{
			name: 'update_markdown_page',
			description: 'Update an existing markdown page.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Page ID' },
					title: { type: 'string', description: 'New title' },
					content: { type: 'string', description: 'New markdown content' },
					tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
					path: { type: 'string', description: 'New hierarchical path' }
				},
				required: ['id']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.WRITE, TOOL_TAGS.UPDATE],
				priority: 65,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				try {
					const updateData: Record<string, unknown> = {};
					if (params.title !== undefined) updateData.title = params.title;
					if (params.content !== undefined) updateData.content = params.content;
					if (params.tags !== undefined) updateData.tags = params.tags;
					if (params.path !== undefined) updateData.path = params.path;

					const page = await markdownRepo.update(params.id as string, userId, updateData);
					return page;
				} catch (error) {
					return {
						error: error instanceof Error ? error.message : 'Failed to update page'
					};
				}
			}
		},
		{
			name: 'delete_markdown_page',
			description: 'Delete a markdown page by ID. This also deletes all child pages.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Page ID to delete' }
				},
				required: ['id']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.WRITE, TOOL_TAGS.DELETE],
				priority: 60,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				const success = await markdownRepo.delete(params.id as string, userId);
				return { success, id: params.id };
			}
		},
		{
			name: 'get_markdown_tree',
			description: 'Get the hierarchical tree structure of all markdown pages.',
			parameters: {
				type: 'object',
				properties: {}
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.READ, TOOL_TAGS.QUERY],
				priority: 70,
				essential: false
			},
			execute: async () => {
				return await markdownRepo.getTree(userId);
			}
		},
		{
			name: 'get_markdown_versions',
			description: 'Get version history for a specific markdown page.',
			parameters: {
				type: 'object',
				properties: {
					pageId: { type: 'string', description: 'Page ID' }
				},
				required: ['pageId']
			},
			metadata: {
				category: MODULE_CATEGORY,
				tags: [TOOL_TAGS.READ, TOOL_TAGS.QUERY],
				priority: 65,
				essential: false
			},
			execute: async (params: Record<string, unknown>) => {
				return await markdownRepo.getVersions(params.pageId as string, userId);
			}
		}
	];
}

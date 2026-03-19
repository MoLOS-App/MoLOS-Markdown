import type { ToolDefinition, QuickNoteChecklistItem } from '../../models/index.js';
import { MarkdownRepository } from '../repositories/markdown-repository.js';
import { QuickNotesRepository } from '../repositories/quick-notes-repository.js';

const MODULE_CATEGORY = 'markdown';

const TOOL_TAGS = {
	READ: 'read',
	WRITE: 'write',
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete',
	SEARCH: 'search',
	QUERY: 'query'
} as const;

export function getAiTools(userId: string): ToolDefinition[] {
	const markdownRepo = new MarkdownRepository();
	const quickNotesRepo = new QuickNotesRepository();

	return [
		{
			name: 'get_markdown_pages',
			description: 'Retrieve markdown pages for user.',
			parameters: {
				type: 'object',
				properties: {
					limit: { type: 'number', default: 10 }
				}
			},
			metadata: { submodule: 'pages' },
			execute: async (params) => {
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
			metadata: { submodule: 'pages' },
			execute: async (params) => {
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
			metadata: { submodule: 'pages' },
			execute: async (params) => {
				return await markdownRepo.search(
					userId,
					params.query as string,
					params.limit as number
				);
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
					tags: { type: 'array', items: { type: 'string' }, description: 'Tags for page' }
				},
				required: ['title']
			},
			metadata: { submodule: 'pages' },
			execute: async (params) => {
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
					path: { type: 'string', description: 'New path' }
				},
				required: ['id']
			},
			metadata: { submodule: 'pages' },
			execute: async (params) => {
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
			metadata: { submodule: 'pages' },
			execute: async (params) => {
				const success = await markdownRepo.delete(params.id as string, userId);
				return { success, id: params.id };
			}
		},
		{
			name: 'get_markdown_tree',
			description: 'Get hierarchical tree structure of all markdown pages.',
			parameters: {
				type: 'object',
				properties: {}
			},
			metadata: { submodule: 'pages' },
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
			metadata: { submodule: 'pages' },
			execute: async (params) => {
				return await markdownRepo.getVersions(params.pageId as string, userId);
			}
		},
		{
			name: 'restore_markdown_version',
			description: 'Restore a markdown page to a previous version.',
			parameters: {
				type: 'object',
				properties: {
					pageId: { type: 'string', description: 'Page ID to restore' },
					version: { type: 'number', description: 'Version number to restore' }
				},
				required: ['pageId', 'version']
			},
			metadata: { submodule: 'pages' },
			execute: async (params) => {
				try {
					const restored = await markdownRepo.restoreVersion(
						params.pageId as string,
						params.version as number,
						userId
					);
					if (!restored) {
						return { error: 'Page or version not found' };
					}
					return restored;
				} catch (error) {
					return {
						error: error instanceof Error ? error.message : 'Failed to restore version'
					};
				}
			}
		},

		{
			name: 'get_quick_notes',
			description:
				'Get all quick notes for user. Supports filtering by archived, pinned, or search.',
			parameters: {
				type: 'object',
				properties: {
					includeArchived: {
						type: 'boolean',
						description: 'Include archived notes in results (default: false)',
						default: false
					},
					pinnedFirst: {
						type: 'boolean',
						description: 'Show pinned notes first (default: false)',
						default: false
					},
					search: { type: 'string', description: 'Search query' },
					limit: { type: 'number', description: 'Limit results', default: 20 }
				}
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				if (params.search) {
					return await quickNotesRepo.searchByUserId(
						userId,
						params.search as string,
						params.includeArchived as boolean
					);
				}
				const notes = await quickNotesRepo.listByUserId(userId, {
					includeArchived: (params.includeArchived as boolean) || false,
					pinnedFirst: (params.pinnedFirst as boolean) || false
				});
				const limit = (params.limit as number) || 20;
				return notes.slice(0, limit);
			}
		},
		{
			name: 'get_quick_note',
			description: 'Get a specific quick note by ID.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'The note ID' }
				},
				required: ['id']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const note = await quickNotesRepo.getById(params.id as string, userId);
				if (!note) return { error: 'Note not found' };
				return note;
			}
		},
		{
			name: 'search_quick_notes',
			description: 'Search quick notes by title and content.',
			parameters: {
				type: 'object',
				properties: {
					query: { type: 'string', description: 'Search query' },
					includeArchived: {
						type: 'boolean',
						description: 'Include archived notes in results',
						default: false
					},
					limit: { type: 'number', description: 'Limit results', default: 20 }
				},
				required: ['query']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const notes = await quickNotesRepo.searchByUserId(
					userId,
					params.query as string,
					(params.includeArchived as boolean) || false
				);
				const limit = (params.limit as number) || 20;
				return notes.slice(0, limit);
			}
		},
		{
			name: 'create_quick_note',
			description: 'Create a new quick note with markdown, color, labels, and optional checklist.',
			parameters: {
				type: 'object',
				properties: {
					title: { type: 'string', description: 'Note title (optional)' },
					content: { type: 'string', description: 'Markdown content' },
					color: { type: 'string', description: 'Background color code' },
					labels: { type: 'array', items: { type: 'string' }, description: 'Tags array' },
					checklist: {
						type: 'array',
						items: { type: 'object' },
						description: 'Checklist items with text and isChecked'
					}
				},
				required: ['content']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				try {
					const note = await quickNotesRepo.create({
						userId,
						title: params.title as string | undefined,
						content: params.content as string,
						color: params.color as string | undefined,
						labels: params.labels as string[] | undefined,
						checklist: params.checklist as QuickNoteChecklistItem[] | undefined
					});
					return note;
				} catch (error) {
					return {
						error: error instanceof Error ? error.message : 'Failed to create quick note'
					};
				}
			}
		},
		{
			name: 'update_quick_note',
			description:
				'Update a quick note. Supports updating content, color, labels, checklist, pin status, and archive status.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID' },
					title: { type: 'string', description: 'New title' },
					content: { type: 'string', description: 'New markdown content' },
					color: { type: 'string', description: 'New background color' },
					labels: { type: 'array', items: { type: 'string' }, description: 'New tags' },
					checklist: { type: 'array', items: { type: 'object' }, description: 'Checklist items' },
					isPinned: { type: 'boolean', description: 'Pin the note' },
					isArchived: { type: 'boolean', description: 'Archive the note' }
				},
				required: ['id']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				try {
					const updateData: Record<string, unknown> = {};
					if (params.title !== undefined) updateData.title = params.title;
					if (params.content !== undefined) updateData.content = params.content;
					if (params.color !== undefined) updateData.color = params.color;
					if (params.labels !== undefined) updateData.labels = params.labels;
					if (params.checklist !== undefined) updateData.checklist = params.checklist;
					if (params.isPinned !== undefined) updateData.isPinned = params.isPinned;
					if (params.isArchived !== undefined) updateData.isArchived = params.isArchived;

					const note = await quickNotesRepo.update(params.id as string, userId, updateData);
					if (!note) return { error: 'Note not found' };
					return note;
				} catch (error) {
					return {
						error: error instanceof Error ? error.message : 'Failed to update quick note'
					};
				}
			}
		},
		{
			name: 'delete_quick_note',
			description: 'Archive (soft delete) a quick note by ID.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID to delete' }
				},
				required: ['id']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const success = await quickNotesRepo.delete(params.id as string, userId);
				return { success, id: params.id };
			}
		},
		{
			name: 'pin_quick_note',
			description: 'Toggle the pinned status of a quick note.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID' }
				},
				required: ['id']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const note = await quickNotesRepo.togglePin(params.id as string, userId);
				if (!note) return { error: 'Note not found' };
				return note;
			}
		},
		{
			name: 'archive_quick_note',
			description: 'Toggle the archive status of a quick note.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID' }
				},
				required: ['id']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const note = await quickNotesRepo.toggleArchive(params.id as string, userId);
				if (!note) return { error: 'Note not found' };
				return note;
			}
		},
		{
			name: 'toggle_quick_note_checklist_item',
			description: 'Toggle the checked status of a checklist item.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID' },
					itemId: { type: 'string', description: 'Checklist item ID' }
				},
				required: ['id', 'itemId']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const note = await quickNotesRepo.toggleChecklistItem(
					params.id as string,
					userId,
					params.itemId as string
				);
				if (!note) return { error: 'Note not found' };
				return note;
			}
		},
		{
			name: 'update_quick_note_checklist',
			description: 'Update the checklist for a quick note. Replaces entire checklist.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'Note ID' },
					checklist: {
						type: 'array',
						items: { type: 'object' },
						description: 'Checklist items with text and isChecked'
					}
				},
				required: ['id', 'checklist']
			},
			metadata: { submodule: 'quick-notes' },
			execute: async (params) => {
				const note = await quickNotesRepo.updateChecklist(
					params.id as string,
					userId,
					params.checklist as QuickNoteChecklistItem[]
				);
				if (!note) return { error: 'Note not found' };
				return note;
			}
		}
	];
}

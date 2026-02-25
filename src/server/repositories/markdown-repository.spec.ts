import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownRepository } from '../markdown-repository.js';
import { markdownPages, markdownVersions } from '../../db/schema/tables.js';
import { eq } from 'drizzle-orm';

describe('MarkdownRepository', () => {
	let mockDb: any;
	let repo: MarkdownRepository;
	let userId: string;

	beforeEach(() => {
		userId = 'test-user-123';

		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([]),
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis()
		};

		repo = new MarkdownRepository(mockDb);
	});

	describe('getByUserId', () => {
		it('should return pages for a user with limit', async () => {
			const mockPages = [
				{
					id: 'page-1',
					userId: 'test-user-123',
					title: 'Test Page',
					slug: 'test-page',
					content: '# Test',
					isTemplate: 0,
					path: '/test/page',
					tags: '["test"]',
					version: 1,
					createdAt: 1234567890,
					updatedAt: 1234567890
				}
			];

			mockDb.limit.mockResolvedValue(mockPages);

			const result = await repo.getByUserId(userId, 10);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('page-1');
			expect(result[0].title).toBe('Test Page');
			expect(mockDb.limit).toHaveBeenCalledWith(10);
		});

		it('should return all pages when no limit is specified', async () => {
			const mockPages = [
				{
					id: 'page-1',
					userId: 'test-user-123',
					title: 'Test Page',
					slug: 'test-page',
					content: '# Test',
					isTemplate: 0,
					path: '/test/page',
					tags: '["test"]',
					version: 1,
					createdAt: 1234567890,
					updatedAt: 1234567890
				}
			];

			mockDb.limit.mockResolvedValue(mockPages);

			const result = await repo.getByUserId(userId);

			expect(result).toHaveLength(1);
			expect(mockDb.limit).toHaveBeenCalledWith(1000);
		});
	});

	describe('search', () => {
		it('should search pages by title and content', async () => {
			const mockPages = [
				{
					id: 'page-1',
					userId: 'test-user-123',
					title: 'Test Search',
					slug: 'test-search',
					content: '# Test content',
					isTemplate: 0,
					path: '/test/search',
					tags: '[]',
					version: 1,
					createdAt: 1234567890,
					updatedAt: 1234567890
				}
			];

			mockDb.limit.mockResolvedValue(mockPages);

			const result = await repo.search(userId, 'search', 10);

			expect(result).toHaveLength(1);
			expect(result[0].title).toContain('search');
		});
	});

	describe('create', () => {
		it('should create a new page', async () => {
			const mockPage = {
				id: 'new-page-id',
				userId: 'test-user-123',
				title: 'New Page',
				slug: 'new-page',
				content: '# New Content',
				isTemplate: 0,
				path: '/new-page',
				tags: '["new"]',
				version: 1,
				createdAt: 1234567890,
				updatedAt: 1234567890
			};

			mockDb.select.mockReturnThis().limit.mockResolvedValue([mockPage]);

			const result = await repo.create(
				{
					title: 'New Page',
					content: '# New Content',
					tags: ['new']
				},
				userId
			);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(result.title).toBe('New Page');
		});

		it('should throw error when title is missing', async () => {
			await expect(
				repo.create(
					{
						title: '',
						content: '# Test'
					} as any,
					userId
				)
			).rejects.toThrow('Title is required to create a markdown page');
		});
	});

	describe('update', () => {
		it('should update page content and create version', async () => {
			const existingPage = {
				id: 'page-1',
				userId: 'test-user-123',
				title: 'Test Page',
				slug: 'test-page',
				content: '# Old content',
				isTemplate: 0,
				path: '/test/page',
				tags: '[]',
				version: 1,
				createdAt: 1234567890,
				updatedAt: 1234567890
			};

			const updatedPage = {
				...existingPage,
				content: '# New content',
				version: 2,
				updatedAt: 1234567890
			};

			mockDb.select.mockReturnThis().limit.mockResolvedValueOnce([existingPage]);
			mockDb.select.mockReturnThis().limit.mockResolvedValueOnce([updatedPage]);

			const result = await repo.update('page-1', userId, {
				content: '# New content'
			});

			expect(mockDb.update).toHaveBeenCalled();
			expect(result.version).toBe(2);
		});
	});

	describe('delete', () => {
		it('should delete page and descendants', async () => {
			const mockPage = {
				id: 'page-1',
				userId: 'test-user-123',
				title: 'Test Page',
				slug: 'test-page',
				content: '# Test',
				isTemplate: 0,
				path: '/test/page',
				tags: '[]',
				version: 1,
				createdAt: 1234567890,
				updatedAt: 1234567890
			};

			mockDb.select.mockReturnThis().limit.mockResolvedValue([mockPage]);
			mockDb.delete.mockReturnThis().where.mockResolvedValue({ changes: 1 });

			const result = await repo.delete('page-1', userId);

			expect(mockDb.delete).toHaveBeenCalled();
			expect(result).toBe(true);
		});
	});

	describe('getTree', () => {
		it('should build hierarchical tree structure', async () => {
			const mockPages = [
				{
					id: 'page-1',
					userId: 'test-user-123',
					title: 'Root',
					slug: 'root',
					content: '# Root',
					isTemplate: 0,
					path: '/root',
					tags: '[]',
					version: 1,
					createdAt: 1234567890,
					updatedAt: 1234567890
				},
				{
					id: 'page-2',
					userId: 'test-user-123',
					title: 'Child',
					slug: 'child',
					content: '# Child',
					isTemplate: 0,
					path: '/root/child',
					tags: '[]',
					version: 1,
					createdAt: 1234567890,
					updatedAt: 1234567890
				}
			];

			mockDb.select.mockReturnThis().orderBy.mockResolvedValue(mockPages);

			const tree = await repo.getTree(userId);

			expect(tree).toBeDefined();
			expect(tree.length).toBeGreaterThan(0);
		});
	});

	describe('getVersions', () => {
		it('should return version history for a page', async () => {
			const mockVersions = [
				{
					id: 'ver-1',
					userId: 'test-user-123',
					pageId: 'page-1',
					version: 1,
					content: '# Version 1',
					changeDescription: 'Initial version',
					createdAt: 1234567890
				}
			];

			mockDb.select.mockReturnThis().orderBy.mockResolvedValue(mockVersions);

			const result = await repo.getVersions('page-1', userId);

			expect(result).toHaveLength(1);
			expect(result[0].version).toBe(1);
		});
	});

	describe('restoreVersion', () => {
		it('should restore content from a previous version', async () => {
			const mockPage = {
				id: 'page-1',
				userId: 'test-user-123',
				title: 'Test Page',
				slug: 'test-page',
				content: '# Old content',
				isTemplate: 0,
				path: '/test/page',
				tags: '[]',
				version: 2,
				createdAt: 1234567890,
				updatedAt: 1234567890
			};

			const mockVersion = {
				id: 'ver-1',
				userId: 'test-user-123',
				pageId: 'page-1',
				version: 1,
				content: '# Restored content',
				changeDescription: 'Initial version',
				createdAt: 1234567890
			};

			mockDb.select.mockReturnThis().where.mockReturnThis().limit.mockResolvedValueOnce([mockPage]);
			mockDb.select.mockReturnThis().where.mockReturnThis().limit.mockResolvedValueOnce([mockVersion]);
			mockDb.select.mockReturnThis().where.mockReturnThis().limit.mockResolvedValueOnce([mockPage]);

			const result = await repo.restoreVersion('page-1', 1, userId);

			expect(mockDb.update).toHaveBeenCalled();
			expect(result?.content).toBe('# Restored content');
		});
	});
});

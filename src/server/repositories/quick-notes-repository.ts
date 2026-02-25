import { and, desc, eq, like, or, sql, asc } from 'drizzle-orm';
import { BaseRepository } from './base-repository.js';
import { markdownQuickNotes } from '../db/schema/index.js';
import type {
	QuickNote,
	QuickNoteChecklistItem,
	CreateQuickNoteInput,
	UpdateQuickNoteInput
} from '../../models/index.js';

const parseJsonArray = (value: string | null | undefined): string[] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const parseJsonArrayOf = <T>(value: string | null | undefined): T[] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const toJsonString = (value: unknown, fallback: string): string => {
	if (value === null || value === undefined) return fallback;
	return JSON.stringify(value);
};

const mapDbRowToNote = (row: Record<string, any>): QuickNote => {
	return {
		id: row.id,
		userId: row.userId,
		title: row.title ?? undefined,
		content: row.content,
		color: (row.color as any) ?? undefined,
		isPinned: row.isPinned,
		isArchived: row.isArchived,
		labels: parseJsonArray(row.labels),
		checklist: parseJsonArrayOf<QuickNoteChecklistItem>(row.checklist),
		position: row.position ?? 0,
		createdAt: row.createdAt || row.created_at,
		updatedAt: row.updatedAt || row.updated_at
	};
};

export class QuickNotesRepository extends BaseRepository {
	private mapRow(row: Record<string, any>): QuickNote {
		return mapDbRowToNote(row);
	}

	async listByUserId(
		userId: string,
		options: { includeArchived?: boolean; pinnedFirst?: boolean } = {}
	): Promise<QuickNote[]> {
		const conditions = [eq(markdownQuickNotes.userId, userId)];

		if (options.includeArchived === false) {
			conditions.push(eq(markdownQuickNotes.isArchived, false));
		}

		const baseQuery = this.db
			.select()
			.from(markdownQuickNotes)
			.where(and(...conditions));

		// Order by position first, then by pinned status and updated date
		const query = baseQuery.orderBy(
			asc(markdownQuickNotes.position),
			desc(markdownQuickNotes.isPinned),
			desc(markdownQuickNotes.updatedAt)
		);

		const rows = await query;
		return rows.map((row) => this.mapRow(row as any));
	}

	async searchByUserId(
		userId: string,
		query: string,
		includeArchived = false
	): Promise<QuickNote[]> {
		const term = `%${query}%`;
		const conditions = [
			eq(markdownQuickNotes.userId, userId),
			eq(markdownQuickNotes.isArchived, includeArchived ? true : false),
			or(
				like(sql<string>`coalesce(${markdownQuickNotes.title}, '')`, term),
				like(sql<string>`coalesce(${markdownQuickNotes.content}, '')`, term)
			)
		];

		const rows = await this.db
			.select()
			.from(markdownQuickNotes)
			.where(and(...conditions))
			.orderBy(asc(markdownQuickNotes.position), desc(markdownQuickNotes.updatedAt));

		return rows.map((row) => this.mapRow(row as any));
	}

	async getById(id: string, userId: string): Promise<QuickNote | null> {
		const result = await this.db
			.select()
			.from(markdownQuickNotes)
			.where(and(eq(markdownQuickNotes.id, id), eq(markdownQuickNotes.userId, userId)))
			.limit(1);

		if (!result[0]) return null;
		return this.mapRow(result[0]);
	}

	async create(data: CreateQuickNoteInput): Promise<QuickNote> {
		const now = Math.floor(Date.now() / 1000);
		const id = `QN-${Date.now()}`;

		// Get count of existing notes for the user to set position
		const countResult = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(markdownQuickNotes)
			.where(eq(markdownQuickNotes.userId, data.userId || ''));
		
		const position = (countResult[0]?.count ?? 0) + 1;

		const insertData = {
			id,
			userId: data.userId || '',
			title: data.title,
			content: data.content,
			color: data.color,
			isPinned: false,
			isArchived: false,
			labels: toJsonString(data.labels, '[]'),
			checklist: '[]',
			position,
			createdAt: now,
			updatedAt: now
		};

		const result = await this.db
			.insert(markdownQuickNotes)
			.values(insertData as any)
			.returning();

		const row = result[0];
		return this.mapRow(row);
	}

	async update(id: string, userId: string, updates: UpdateQuickNoteInput): Promise<QuickNote | null> {
		const now = Math.floor(Date.now() / 1000);
		const updateData: Record<string, any> = { updatedAt: now };

		if (updates.title !== undefined) updateData.title = updates.title;
		if (updates.content !== undefined) updateData.content = updates.content;
		if (updates.color !== undefined) updateData.color = updates.color;
		if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;
		if (updates.isArchived !== undefined) updateData.isArchived = updates.isArchived;
		if (updates.labels !== undefined) {
			updateData.labels = toJsonString(updates.labels, '[]');
		}

		const result = await this.db
			.update(markdownQuickNotes)
			.set(updateData as any)
			.where(and(eq(markdownQuickNotes.id, id), eq(markdownQuickNotes.userId, userId)))
			.returning();

		if (!result[0]) return null;
		return this.mapRow(result[0]);
	}

	async delete(id: string, userId: string): Promise<boolean> {
		const result = await this.db
			.delete(markdownQuickNotes)
			.where(and(eq(markdownQuickNotes.id, id), eq(markdownQuickNotes.userId, userId)));

		return result.changes > 0;
	}

	async togglePin(id: string, userId: string): Promise<QuickNote | null> {
		const note = await this.getById(id, userId);
		if (!note) return null;

		return this.update(id, userId, { isPinned: !note.isPinned });
	}

	async toggleArchive(id: string, userId: string): Promise<QuickNote | null> {
		const note = await this.getById(id, userId);
		if (!note) return null;

		return this.update(id, userId, { isArchived: !note.isArchived });
	}

	async reorder(sourceId: string, targetId: string, userId: string): Promise<QuickNote | null> {
		// Get both notes
		const sourceNote = await this.getById(sourceId, userId);
		const targetNote = await this.getById(targetId, userId);

		if (!sourceNote || !targetNote) return null;

		// Simple swap: just swap their positions
		const sourcePosition = sourceNote.position;
		const targetPosition = targetNote.position;

		const now = Math.floor(Date.now() / 1000);

		// Update target to source position
		await this.db
			.update(markdownQuickNotes)
			.set({ position: sourcePosition, updatedAt: now })
			.where(eq(markdownQuickNotes.id, targetId));

		// Update source to target position
		const result = await this.db
			.update(markdownQuickNotes)
			.set({ position: targetPosition, updatedAt: now })
			.where(eq(markdownQuickNotes.id, sourceId))
			.returning();

		if (!result[0]) return null;
		return this.mapRow(result[0]);
	}
}

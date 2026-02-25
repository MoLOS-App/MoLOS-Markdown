import { and, desc, eq, like, or, sql } from 'drizzle-orm';
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

export class QuickNotesRepository extends BaseRepository {
	private mapRow(row: typeof markdownQuickNotes.$inferSelect): QuickNote {
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
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
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

		let query;
		if (options.pinnedFirst) {
			query = baseQuery.orderBy(desc(markdownQuickNotes.isPinned), desc(markdownQuickNotes.updatedAt));
		} else {
			query = baseQuery.orderBy(desc(markdownQuickNotes.updatedAt));
		}

		const rows = await query;
		return rows.map((row) => this.mapRow(row));
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
			.orderBy(desc(markdownQuickNotes.updatedAt));

		return rows.map((row) => this.mapRow(row));
	}

	async getById(id: string, userId: string): Promise<QuickNote | null> {
		const rows = await this.db
			.select()
			.from(markdownQuickNotes)
			.where(and(eq(markdownQuickNotes.id, id), eq(markdownQuickNotes.userId, userId)))
			.limit(1);

		return rows[0] ? this.mapRow(rows[0]) : null;
	}

	async create(data: CreateQuickNoteInput): Promise<QuickNote> {
		const now = Math.floor(Date.now() / 1000);
		const id = `QN-${Date.now()}`;

		const result = await this.db
			.insert(markdownQuickNotes)
			.values({
				id,
				userId: data.userId,
				title: data.title,
				content: data.content,
				color: data.color,
				isPinned: false,
				isArchived: false,
				labels: toJsonString(data.labels, '[]'),
				checklist: toJsonString(data.checklist, '[]'),
				createdAt: now,
				updatedAt: now
			})
			.returning();

		const row = result[0];
		return this.mapRow(row);
	}

	async update(id: string, userId: string, updates: UpdateQuickNoteInput): Promise<QuickNote | null> {
		const now = Math.floor(Date.now() / 1000);
		const updateData: Record<string, unknown> = { updatedAt: now };

		if (updates.title !== undefined) updateData.title = updates.title;
		if (updates.content !== undefined) updateData.content = updates.content;
		if (updates.color !== undefined) updateData.color = updates.color;
		if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;
		if (updates.isArchived !== undefined) updateData.isArchived = updates.isArchived;
		if (updates.labels !== undefined) {
			updateData.labels = toJsonString(updates.labels, '[]');
		}
		if (updates.checklist !== undefined) {
			updateData.checklist = toJsonString(updates.checklist, '[]');
		}

		await this.db
			.update(markdownQuickNotes)
			.set(updateData)
			.where(and(eq(markdownQuickNotes.id, id), eq(markdownQuickNotes.userId, userId)));

		return this.getById(id, userId);
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

	async updateChecklist(
		id: string,
		userId: string,
		checklist: QuickNoteChecklistItem[]
	): Promise<QuickNote | null> {
		return this.update(id, userId, { checklist });
	}

	async toggleChecklistItem(
		id: string,
		userId: string,
		itemId: string
	): Promise<QuickNote | null> {
		const note = await this.getById(id, userId);
		if (!note) return null;

		const updatedChecklist = note.checklist.map((item) =>
			item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
		);

		return this.update(id, userId, { checklist: updatedChecklist });
	}
}

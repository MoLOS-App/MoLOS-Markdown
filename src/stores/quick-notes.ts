import { writable, derived } from 'svelte/store';
import type { QuickNote } from '../models/index.js';

export const quickNotes = writable<QuickNote[]>([]);
export const selectedNoteId = writable<string | null>(null);
export const selectedNote = writable<QuickNote | null>(null);
export const showCreateDialog = writable<boolean>(false);
export const showEditDialog = writable<boolean>(false);
export const activeFilter = writable<'all' | 'pinned' | 'archived'>('all');
export const searchQuery = writable<string>('');

export const filteredNotes = derived(
	[quickNotes, activeFilter, searchQuery],
	([$quickNotes, $activeFilter, $searchQuery]) => {
		let result = [...$quickNotes];

		if ($activeFilter === 'pinned') {
			result = result.filter((note) => note.isPinned);
		} else if ($activeFilter === 'archived') {
			result = result.filter((note) => note.isArchived);
		} else {
			result = result.filter((note) => !note.isArchived);
		}

		if ($searchQuery) {
			const query = $searchQuery.toLowerCase();
			result = result.filter(
				(note) =>
					(note.title?.toLowerCase().includes(query) ||
						note.content.toLowerCase().includes(query))
			);
		}

		return result;
	}
);

export const pinnedCount = derived(
	quickNotes,
	($quickNotes) => $quickNotes.filter((n) => n.isPinned).length
);

export const archivedCount = derived(
	quickNotes,
	($quickNotes) => $quickNotes.filter((n) => n.isArchived).length
);

export function selectNote(note: QuickNote): void {
	selectedNoteId.set(note.id);
	selectedNote.set(note);
}

export function clearSelectedNote(): void {
	selectedNoteId.set(null);
	selectedNote.set(null);
}

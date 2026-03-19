import type { QuickNote } from '../models/index.js';

// State containers
let notes = $state<QuickNote[]>([]);
let selectedId = $state<string | null>(null);
let selected = $state<QuickNote | null>(null);
let createDialogOpen = $state<boolean>(false);
let editDialogOpen = $state<boolean>(false);
let filter = $state<'all' | 'pinned' | 'archived'>('all');
let search = $state<string>('');

// Derived state
const filtered = $derived.by(() => {
	let result = [...notes];

	if (filter === 'pinned') {
		result = result.filter((note) => note.isPinned);
	} else if (filter === 'archived') {
		result = result.filter((note) => note.isArchived);
	} else {
		result = result.filter((note) => !note.isArchived);
	}

	if (search) {
		const query = search.toLowerCase();
		result = result.filter(
			(note) =>
				(note.title?.toLowerCase().includes(query) ||
					note.content.toLowerCase().includes(query))
		);
	}

	return result;
});

const pinnedCount = $derived(notes.filter((n) => n.isPinned).length);
const archivedCount = $derived(notes.filter((n) => n.isArchived).length);

// Export with getters (safe pattern for Svelte 5)
export const quickNotesState = {
	get notes() { return notes; },
	set notes(value: QuickNote[]) { notes = value; },
	get selectedId() { return selectedId; },
	set selectedId(value: string | null) { selectedId = value; },
	get selected() { return selected; },
	set selected(value: QuickNote | null) { selected = value; },
	get createDialogOpen() { return createDialogOpen; },
	set createDialogOpen(value: boolean) { createDialogOpen = value; },
	get editDialogOpen() { return editDialogOpen; },
	set editDialogOpen(value: boolean) { editDialogOpen = value; },
	get filter() { return filter; },
	set filter(value: 'all' | 'pinned' | 'archived') { filter = value; },
	get search() { return search; },
	set search(value: string) { search = value; },
	get filtered() { return filtered; },
	get pinnedCount() { return pinnedCount; },
	get archivedCount() { return archivedCount; }
};

// Actions
export function selectNote(note: QuickNote): void {
	selectedId = note.id;
	selected = note;
}

export function clearSelectedNote(): void {
	selectedId = null;
	selected = null;
}

export function setNotes(newNotes: QuickNote[]): void {
	notes = newNotes;
}

// Legacy exports for backward compatibility
export const quickNotes = {
	subscribe: (fn: (value: QuickNote[]) => void) => {
		// Initial value
		fn(notes);
		// Return unsubscribe function (no-op for runes)
		return () => {};
	},
	set: (value: QuickNote[]) => { notes = value; },
	update: (fn: (value: QuickNote[]) => QuickNote[]) => { notes = fn(notes); }
};

export const selectedNoteId = {
	subscribe: (fn: (value: string | null) => void) => { fn(selectedId); return () => {}; },
	set: (value: string | null) => { selectedId = value; }
};

export const selectedNote = {
	subscribe: (fn: (value: QuickNote | null) => void) => { fn(selected); return () => {}; },
	set: (value: QuickNote | null) => { selected = value; }
};

export const showCreateDialog = {
	subscribe: (fn: (value: boolean) => void) => { fn(createDialogOpen); return () => {}; },
	set: (value: boolean) => { createDialogOpen = value; }
};

export const showEditDialog = {
	subscribe: (fn: (value: boolean) => void) => { fn(editDialogOpen); return () => {}; },
	set: (value: boolean) => { editDialogOpen = value; }
};

export const activeFilter = {
	subscribe: (fn: (value: 'all' | 'pinned' | 'archived') => void) => { fn(filter); return () => {}; },
	set: (value: 'all' | 'pinned' | 'archived') => { filter = value; }
};

export const searchQuery = {
	subscribe: (fn: (value: string) => void) => { fn(search); return () => {}; },
	set: (value: string) => { search = value; }
};

export const filteredNotes = {
	subscribe: (fn: (value: QuickNote[]) => void) => { fn(filtered); return () => {}; }
};

export const pinnedCountStore = {
	subscribe: (fn: (value: number) => void) => { fn(pinnedCount); return () => {}; }
};

export const archivedCountStore = {
	subscribe: (fn: (value: number) => void) => { fn(archivedCount); return () => {}; }
};

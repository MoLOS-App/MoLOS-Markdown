<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageServerLoad } from './$types';
	import type { QuickNote } from '../../../models/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { StickyNote, Plus, Search, Archive, Pin, Grid, List, X as CloseIcon } from 'lucide-svelte';
	import { QuickNoteCard, QuickNoteCreateDialog } from '../../../lib/components';
	import { quickNotes, selectNote } from '../../../stores';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';

	interface Props {
		data: PageServerLoad;
	}

	let { data }: Props = $props();

	let showDeleteDialog = $state(false);
	let noteToDelete = $state<QuickNote | null>(null);
	let showEditDialog = $state(false);
	let noteToEdit = $state<QuickNote | null>(null);
	let viewMode = $state<'masonry' | 'list'>('masonry');

	let activeFilter = $state<'all' | 'pinned' | 'archived'>('all');
	let searchQuery = $state('');
	let showCreateDialog = $state(false);

	onMount(async () => {
		const response = await fetch('/api/MoLOS-Markdown/quick-notes');
		if (response.ok) {
			const notes = await response.json();
			quickNotes.set(notes);
		}
	});

	let filteredNotes = $derived(() => {
		let result = [...$quickNotes];

		if (activeFilter === 'pinned') {
			result = result.filter((note) => note.isPinned);
		} else if (activeFilter === 'archived') {
			result = result.filter((note) => note.isArchived);
		} else {
			result = result.filter((note) => !note.isArchived);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(note) =>
					(note.title?.toLowerCase().includes(query) ||
						note.content.toLowerCase().includes(query))
			);
		}

		// Sort by position (ascending)
		result.sort((a, b) => a.position - b.position);

		return result;
	});

	let pinnedCount = $derived($quickNotes.filter((n) => n.isPinned).length);
	let archivedCount = $derived($quickNotes.filter((n) => n.isArchived).length);

	async function handleCreate(noteData: any) {
		const response = await fetch('/api/MoLOS-Markdown/quick-notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: '', ...noteData })
		});

		if (response.ok) {
			const newNote = await response.json();
			quickNotes.update(notes => [newNote, ...notes]);
			showCreateDialog = false;
		}
	}

	async function handleUpdate(noteData: any) {
		if (!noteToEdit) return;

		const response = await fetch(`/api/MoLOS-Markdown/quick-notes/${noteToEdit.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: noteToEdit.id, ...noteData })
		});

		if (response.ok) {
			const updated = await response.json();
			quickNotes.update(notes => notes.map(n => n.id === noteToEdit.id ? updated : n));
			showEditDialog = false;
			noteToEdit = null;
		}
	}

	async function handleArchive(note: QuickNote) {
		const response = await fetch(`/api/MoLOS-Markdown/quick-notes/${note.id}/archive`, {
			method: 'POST'
		});

		if (response.ok) {
			const updated = await response.json();
			quickNotes.update(notes => notes.map(n => n.id === note.id ? updated : n));
		}
	}

	async function handleTogglePin(note: QuickNote) {
		const response = await fetch(`/api/MoLOS-Markdown/quick-notes/${note.id}/pin`, {
			method: 'POST'
		});

		if (response.ok) {
			const updated = await response.json();
			quickNotes.update(notes => notes.map(n => n.id === note.id ? updated : n));
		}
	}

	async function handleDelete(note: QuickNote) {
		noteToDelete = note;
		showDeleteDialog = true;
	}

	async function confirmDelete() {
		if (!noteToDelete) return;

		const response = await fetch(`/api/MoLOS-Markdown/quick-notes/${noteToDelete.id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: noteToDelete.id })
		});

		if (response.ok) {
			quickNotes.update(notes => notes.filter(n => n.id !== noteToDelete.id));
			showDeleteDialog = false;
			noteToDelete = null;
		}
	}

	function handleNoteClick(note: QuickNote) {
		noteToEdit = note;
		showEditDialog = true;
	}

	async function handleReorder(sourceId: string, targetId: string) {
		const response = await fetch('/api/MoLOS-Markdown/quick-notes/reorder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sourceId, targetId })
		});

		if (response.ok) {
			// Refresh notes to get updated positions
			const notesResponse = await fetch('/api/MoLOS-Markdown/quick-notes');
			if (notesResponse.ok) {
				const notes = await notesResponse.json();
				quickNotes.set(notes);
			}
		}
	}
</script>

<div class="min-h-screen">
	<header class="sticky top-0 z-10 px-4 py-3 border-b sm:px-6 sm:py-4">
		<div class="flex flex-col items-start justify-between w-full gap-3 sm:flex-row sm:items-center sm:gap-6">
			<div class="flex items-center justify-between flex-1 w-full gap-3 sm:gap-6 sm:w-auto">
				<div class="flex items-center flex-shrink-0 gap-3">
					<div class="p-2 rounded-lg bg-emerald-500/10">
						<StickyNote class="w-5 h-5 text-emerald-500" />
					</div>
					<div class="flex flex-col">
						<h1 class="text-lg font-bold tracking-tight sm:text-xl">Quick Notes</h1>
						<p class="hidden text-xs sm:text-sm text-muted-foreground sm:block">Capture your thoughts</p>
					</div>
				<div class="hidden w-px h-8 bg-border sm:block"></div>
				</div>


				<div class="relative w-full mx-12 sm:flex-1 sm:max-w-full">
					<Search class="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
					<Input
						oninput={(e) => searchQuery = e.target.value}
						placeholder="Search notes..."
						class="pl-10 transition-colors h-9 sm:h-10 bg-muted/50 border-muted focus-visible:bg-background"
					/>
				</div>

				<div class="flex items-center justify-between w-full gap-2 sm:gap-3 sm:w-auto sm:justify-end">
					<Button
						variant="default"
						class="hidden h-9 sm:h-10 sm:flex"
						onclick={() => showCreateDialog = true}
					>
						<Plus class="w-4 h-4 mr-2" />
						Create Note
					</Button>

					<Select bind:value={activeFilter}>
						<SelectTrigger class="w-[140px] sm:w-[160px] h-9 sm:h-10">
							{#if activeFilter === 'pinned'}
								<Pin class="w-4 h-4 sm:mr-2" />
								<span>Pinned</span>
							{:else if activeFilter === 'archived'}
								<Archive class="w-4 h-4 sm:mr-2" />
								<span>Archived</span>
							{:else}
								<Grid class="w-4 h-4 sm:mr-2" />
								<span>All</span>
							{/if}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								<Grid class="w-4 h-4 mr-2" />
								<span>All</span>
							</SelectItem>
							<SelectItem value="pinned">
								<Pin class="w-4 h-4 mr-2" />
								<span>Pinned</span>
							</SelectItem>
							<SelectItem value="archived">
								<Archive class="w-4 h-4 mr-2" />
								<span>Archived</span>
							</SelectItem>
						</SelectContent>
					</Select>

					<Button
						size="icon"
						variant="ghost"
						class="hidden sm:flex"
						onclick={() => viewMode = viewMode === 'masonry' ? 'list' : 'masonry'}
						aria-label="Toggle view mode"
					>
						{#if viewMode === 'masonry'}
							<List class="w-5 h-5" />
						{:else}
							<Grid class="w-5 h-5" />
						{/if}
					</Button>
				</div>
			</div>
		</header>

	<main class="flex-1 p-4 overflow-y-auto sm:p-6">
		{#if $quickNotes.length === 0}
			<div class="flex-1 flex items-center justify-center min-h-[400px]">
				<div class="max-w-md text-center">
					<div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 sm:w-20 sm:h-20 sm:mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
						<StickyNote class="w-8 h-8 sm:h-10 sm:w-10 text-emerald-500/50" />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight sm:text-xl">No notes yet</h3>
					<p class="mb-4 text-xs text-muted-foreground sm:text-sm sm:mb-6">
						Create your first quick note. Use colors and markdown to organize your thoughts.
					</p>
					<Button onclick={() => showCreateDialog = true}>
						<Plus class="w-4 h-4 sm:mr-2" />
						Create Note
					</Button>
				</div>
			</div>
		{:else}
			<div class="mx-auto max-w-7xl">
				{#if viewMode === 'masonry'}
					<div class="notes-grid">
						{#each filteredNotes() as note}
							<QuickNoteCard
								{note}
								onClick={handleNoteClick}
								onArchive={handleArchive}
								onTogglePin={handleTogglePin}
								onDelete={handleDelete}
								onReorder={handleReorder}
							/>
						{/each}
					</div>
				{:else}
					<div class="max-w-3xl mx-auto space-y-2">
						{#each filteredNotes() as note}
							<QuickNoteCard
								{note}
								onClick={handleNoteClick}
								onArchive={handleArchive}
								onTogglePin={handleTogglePin}
								onDelete={handleDelete}
								onReorder={handleReorder}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<div class="fixed z-20 bottom-6 right-6">
		<Button
			size="lg"
			class="transition-all duration-200 rounded-full shadow-lg h-14 w-14 hover:shadow-xl hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
			onclick={() => showCreateDialog = true}
			aria-label="Create new note"
		>
			<Plus class="h-7 w-7" />
		</Button>
	</div>

	{#if showCreateDialog}
		<QuickNoteCreateDialog
			onCreate={handleCreate}
			onClose={() => showCreateDialog = false}
		/>
	{/if}

	{#if showEditDialog && noteToEdit}
		<QuickNoteCreateDialog
			onCreate={handleUpdate}
			onClose={() => { showEditDialog = false; noteToEdit = null; }}
			initialData={noteToEdit}
			isEditing={true}
		/>
	{/if}

	{#if showDeleteDialog && noteToDelete}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			style="background-color: rgba(0, 0, 0, 0.5);"
			onclick={() => showDeleteDialog = false}
		>
			<div
				class="max-w-sm p-6 mx-4 shadow-2xl rounded-xl"
				style="background-color: var(--popover);"
				onclick={(e) => e.stopPropagation()}
			>
				<h3 class="mb-2 text-lg font-semibold" style="color: var(--foreground);">Delete Note?</h3>
				<p class="mb-6 text-sm" style="color: var(--muted-foreground);">
					This note will be permanently deleted. This action cannot be undone.
				</p>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => showDeleteDialog = false}>Cancel</Button>
					<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.notes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.notes-grid {
			gap: 1.5rem;
		}
	}
</style>

<script lang="ts">
	import type { PageServerLoad } from './$types';
	import type { QuickNote } from '../../../models/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { StickyNote, Plus, Search, Archive, Pin, Grid, List, X as CloseIcon } from 'lucide-svelte';
	import { QuickNoteCard } from '../../../lib/components/QuickNoteCard.svelte';
	import QuickNoteCreateDialog from '../../../lib/components/QuickNoteCreateDialog.svelte';
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
	let viewMode = $state<'masonry' | 'list'>('masonry');

	let activeFilter = $state<'all' | 'pinned' | 'archived'>('all');
	let searchQuery = $state('');
	let showCreateDialog = $state(false);
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
		selectNote(note);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
	<header class="border-b bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 w-full">
			<div class="flex items-center gap-3 sm:gap-6 flex-1 w-full sm:w-auto">
				<div class="flex items-center gap-3 flex-shrink-0">
					<div class="p-2 bg-emerald-500/10 rounded-lg">
						<StickyNote class="h-5 w-5 text-emerald-500" />
					</div>
					<div class="flex flex-col">
						<h1 class="text-lg sm:text-xl font-bold tracking-tight">Quick Notes</h1>
						<p class="text-xs sm:text-sm text-muted-foreground hidden sm:block">Capture your thoughts</p>
					</div>
				</div>

				<div class="h-8 w-px bg-border hidden sm:block"></div>

				<div class="relative w-full sm:flex-1 sm:max-w-md">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						oninput={(e) => searchQuery = e.target.value}
						placeholder="Search notes..."
						class="pl-10 h-9 sm:h-10 bg-muted/50 border-muted focus-visible:bg-background transition-colors"
					/>
				</div>

				<div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
					<Select bind:value={activeFilter}>
						<SelectTrigger class="w-[140px] sm:w-[160px] h-9 sm:h-10">
							{#if activeFilter === 'pinned'}
								<Pin class="h-4 w-4 sm:mr-2" />
								<span>Pinned</span>
							{:else if activeFilter === 'archived'}
								<Archive class="h-4 w-4 sm:mr-2" />
								<span>Archived</span>
							{:else}
								<Grid class="h-4 w-4 sm:mr-2" />
								<span>All</span>
							{/if}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								<Grid class="h-4 w-4 mr-2" />
								<span>All</span>
							</SelectItem>
							<SelectItem value="pinned">
								<Pin class="h-4 w-4 mr-2" />
								<span>Pinned</span>
							</SelectItem>
							<SelectItem value="archived">
								<Archive class="h-4 w-4 mr-2" />
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
							<List class="h-5 w-5" />
						{:else}
							<Grid class="h-5 w-5" />
						{/if}
					</Button>
				</div>
			</div>
		</header>

	<main class="flex-1 overflow-y-auto bg-muted/30/50 backdrop-blur-sm p-4 sm:p-6">
		{#if $quickNotes.length === 0}
			<div class="flex-1 flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md">
					<div class="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
						<StickyNote class="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500/50" />
					</div>
					<h3 class="text-lg sm:text-xl font-bold mb-2 tracking-tight">No notes yet</h3>
					<p class="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">
						Create your first quick note. Use colors, checklists, and markdown to organize your thoughts.
					</p>
					<Button onclick={() => showCreateDialog = true}>
						<Plus class="h-4 w-4 sm:mr-2" />
						Create Note
					</Button>
				</div>
			</div>
		{:else}
			<div class="max-w-7xl mx-auto">
				{#if viewMode === 'masonry'}
					<div class="notes-grid">
						{#each filteredNotes() as note}
							<QuickNoteCard
								{note}
								onClick={handleNoteClick}
								onArchive={handleArchive}
								onDelete={handleDelete}
							/>
						{/each}
					</div>
				{:else}
					<div class="space-y-2 max-w-3xl mx-auto">
						{#each filteredNotes() as note}
							<QuickNoteCard
								{note}
								onClick={handleNoteClick}
								onArchive={handleArchive}
								onDelete={handleDelete}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<div class="fixed bottom-6 right-6 z-20">
		<Button
			size="lg"
			class="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
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

	{#if showDeleteDialog && noteToDelete}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => showDeleteDialog = false}>
			<div class="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-semibold mb-2">Delete Note?</h3>
				<p class="text-muted-foreground mb-6">
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

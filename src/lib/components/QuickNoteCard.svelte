<script lang="ts">
	import type { QuickNote } from '../../models/index.js';
	import { marked } from 'marked';
	import { Button } from '$lib/components/ui/button';
	import { StickyNote, Archive, Trash2, Check, X, MoreVertical } from 'lucide-svelte';

	interface Props {
		note: QuickNote;
		onClick?: (note: QuickNote) => void;
		onArchive?: (note: QuickNote) => void;
		onDelete?: (note: QuickNote) => void;
		onTogglePin?: (note: QuickNote) => void;
		onToggleChecklist?: (noteId: string, itemId: string) => void;
	}

	let {
		note,
		onClick,
		onArchive,
		onDelete,
		onTogglePin,
		onToggleChecklist
	}: Props = $props();

	let showMenu = $state(false);
	let isExpanded = $state(false);

	const renderedContent = $derived(marked(note.content));

	const completedChecklistItems = $derived(
		note.checklist.filter((item) => item.isChecked).length
	);
	const totalChecklistItems = $derived(note.checklist.length);

	const colorClasses = $derived(() => {
		const colorMap: Record<string, string> = {
			default: 'bg-white border-gray-200',
			red: 'bg-red-50 border-red-200',
			orange: 'bg-orange-50 border-orange-200',
			yellow: 'bg-yellow-50 border-yellow-200',
			green: 'bg-green-50 border-green-200',
			teal: 'bg-teal-50 border-teal-200',
			blue: 'bg-blue-50 border-blue-200',
			'dark-blue': 'bg-blue-900/10 border-blue-900/20',
			purple: 'bg-purple-50 border-purple-200',
			pink: 'bg-pink-50 border-pink-200',
			brown: 'bg-amber-100 border-amber-200',
			gray: 'bg-gray-50 border-gray-200'
		};
		return colorMap[note.color || 'default'];
	});
</script>

<div
	class="relative p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer {colorClasses}"
	onclick={() => onClick?.(note)}
>
	{#if note.isPinned}
		<div class="absolute top-2 right-2">
			<StickyNote class="h-4 w-4 text-amber-500 fill-amber-500" />
		</div>
	{/if}

	<div class="flex items-start justify-between mb-2">
		{#if note.title}
			<h3 class="font-semibold text-gray-900 line-clamp-2 text-sm">{note.title}</h3>
		{/if}
		<div class="relative" onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }}>
			<button
				class="p-1.5 rounded-md hover:bg-black/5 transition-colors text-gray-500"
				aria-label="More options"
			>
				<MoreVertical class="h-4 w-4" />
			</button>
			{#if showMenu}
				<div class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
					<button
						class="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left text-sm"
						onclick={(e) => {
							e.stopPropagation();
							onTogglePin?.(note);
							showMenu = false;
						}}
					>
						<Check class="h-4 w-4" />
						<span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
					</button>
					<button
						class="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left text-sm"
						onclick={(e) => {
							e.stopPropagation();
							onArchive?.(note);
							showMenu = false;
						}}
					>
						<Archive class="h-4 w-4" />
						<span>{note.isArchived ? 'Unarchive' : 'Archive'}</span>
					</button>
					<button
						class="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-left text-sm text-red-600"
						onclick={(e) => {
							e.stopPropagation();
							onDelete?.(note);
							showMenu = false;
						}}
					>
						<Trash2 class="h-4 w-4" />
						<span>Delete</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="markdown-content prose prose-sm max-w-none">
		{#if !isExpanded}
			<div class="line-clamp-3">
				{@html renderedContent}
			</div>
			{#if note.content.length > 200}
				<button
					class="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
					onclick={(e) => {
						e.stopPropagation();
						isExpanded = true;
					}}
				>
					Show more
				</button>
			{/if}
		{:else}
			{@html renderedContent}
		{/if}
	</div>

	{#if note.checklist.length > 0}
		<div class="mt-3 pt-3 border-t border-gray-200">
			<div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
				<span>{completedChecklistItems}/{totalChecklistItems} completed</span>
			</div>
			<div class="space-y-1">
				{#each note.checklist as item, index (i)}
					<div class="flex items-center gap-2">
						<button
							class="flex-shrink-0 p-1 rounded hover:bg-black/5"
							onclick={(e) => {
								e.stopPropagation();
								onToggleChecklist?.(note.id, item.id);
							}}
							aria-label={item.isChecked ? 'Mark as unchecked' : 'Mark as checked'}
						>
							{#if item.isChecked}
								<Check class="h-4 w-4 text-green-600" />
							{:else}
								<div class="h-4 w-4 border-2 border-gray-300 rounded" />
							{/if}
						</button>
						<span class="text-sm text-gray-700 flex-1">
							{#if item.isChecked}
								<span class="line-through text-gray-400">{item.text}</span>
							{:else}
								{item.text}
							{/if}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

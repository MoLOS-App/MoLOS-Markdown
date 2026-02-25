<script lang="ts">
	import type { QuickNote } from '../../models/index.js';
	import { StickyNote, Archive, Trash2, Check, EllipsisVertical } from 'lucide-svelte';

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
	let menuContainer = $state<HTMLElement | null>(null);
	let contentContainer = $state<HTMLElement | null>(null);
	const MAX_EXPANDED_HEIGHT = 400; // Maximum height in pixels for expanded content

	const completedChecklistItems = $derived(
		note.checklist.filter((item) => item.isChecked).length
	);
	const totalChecklistItems = $derived(note.checklist.length);

	// Calculate optimal text color based on background luminance
	const getContrastColor = (hexColor: string): string => {
		// Remove hash if present
		const hex = hexColor.replace('#', '');

		// Parse RGB values
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Calculate luminance using the relative luminance formula
		// https://www.w3.org/WAI/GL/wiki/Relative_luminance
		const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

		// Return black for light backgrounds, white for dark backgrounds
		// Using a threshold of 0.5 for good contrast
		return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
	};

	const noteBackgroundColor = $derived(note.color || '#fef3c7');
	const noteTextColor = $derived(getContrastColor(noteBackgroundColor));

	// Close menu when clicking outside
	$effect(() => {
		if (showMenu) {
			const handleClickOutside = (e: MouseEvent) => {
				if (menuContainer && !menuContainer.contains(e.target as Node)) {
					showMenu = false;
				}
			};
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});


</script>

<div
	class="relative p-4 transition-all duration-300 ease-out rounded-sm shadow-md cursor-pointer sticky-note group"
	style="background-color: {noteBackgroundColor}; color: {noteTextColor}; max-height: {isExpanded ? '600px' : 'auto'}; overflow: hidden;"
	onclick={() => {
		onClick?.(note);
		showMenu = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(note);
			showMenu = false;
		}
	}}
	role="button"
	tabindex="0"
>
	<!-- Folded corner effect -->
	<div class="absolute top-0 right-0 z-0 w-0 h-0 folded-corner border-t-32 border-r-32 border-r-transparent" style="border-top-color: {noteTextColor}; opacity: 0.05;"></div>

	{#if note.isPinned}
		<div class="absolute z-20 -top-1 right-6">
			<div class="p-1 rounded-full shadow-sm bg-amber-400">
				<StickyNote class="w-3 h-3" />
			</div>
		</div>
	{/if}

	<!-- Delete icon on hover -->
	<button
		class="absolute -top-2 -right-2 z-20 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
		style="background-color: var(--card);"
		onclick={(e) => {
			e.stopPropagation();
			onDelete?.(note);
		}}
		aria-label="Delete note"
	>
		<Trash2 class="h-3.5 w-3.5 transition-colors" style="color: var(--destructive);" />
	</button>

	<div class="flex items-start justify-between mb-2">
		{#if note.title}
			<h3 class="text-sm font-bold line-clamp-2 drop-shadow-sm">{note.title}</h3>
		{/if}
		<div class="relative ml-2 shrink-0" bind:this={menuContainer} onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }} role="button" tabindex="0" onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				showMenu = !showMenu;
			}
		}}>
			<button
				class="p-1 transition-colors rounded"
				style="hover: background-color: {noteTextColor}; opacity: 0.1;"
				aria-label="More options"
			>
				<EllipsisVertical class="w-4 h-4" />
			</button>
			{#if showMenu}
				<div
					class="absolute right-0 z-20 py-1 mt-1 rounded-lg shadow-lg top-full min-w-35"
					style="background-color: var(--popover); border-color: var(--border);"
				>
					<button
						class="flex items-center w-full gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50"
						style="color: var(--popover-foreground);"
						onclick={(e) => {
							e.stopPropagation();
							onTogglePin?.(note);
							showMenu = false;
						}}
					>
						<Check class="w-4 h-4" />
						<span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
					</button>
					<button
						class="flex items-center w-full gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50"
						style="color: var(--popover-foreground);"
						onclick={(e) => {
							e.stopPropagation();
							onArchive?.(note);
							showMenu = false;
						}}
					>
						<Archive class="w-4 h-4" />
						<span>{note.isArchived ? 'Unarchive' : 'Archive'}</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="prose-sm prose whitespace-pre-wrap max-w-none" bind:this={contentContainer}>
		{#if !isExpanded}
			<div class="line-clamp-3">
				{note.content}
			</div>
			{#if note.content.length > 200}
				<button
					class="mt-2 text-xs hover:underline"
					style="color: {noteTextColor};"
					onclick={(e) => {
						e.stopPropagation();
						isExpanded = true;
					}}
				>
					Show more
				</button>
			{/if}
		{:else}
			<div class="overflow-y-auto" style="max-height: {MAX_EXPANDED_HEIGHT}px;">
				{note.content}
			</div>
			<button
				class="mt-2 text-xs hover:underline"
				style="color: {noteTextColor};"
				onclick={(e) => {
					e.stopPropagation();
					isExpanded = false;
				}}
			>
				Show less
			</button>
		{/if}
	</div>

	{#if note.checklist.length > 0}
		<div class="pt-3 mt-3 border-t" style="border-color: {noteTextColor}; opacity: 0.2;">
			<div class="flex items-center gap-2 mb-2 text-xs" style="color: {noteTextColor};">
				<span>{completedChecklistItems}/{totalChecklistItems} completed</span>
			</div>
			<div class="space-y-1">
				{#each note.checklist as item}
					<div class="flex items-center gap-2">
						<button
							class="p-1 rounded shrink-0"
							style="hover: background-color: {noteTextColor}; opacity: 0.1;"
							onclick={(e) => {
								e.stopPropagation();
								onToggleChecklist?.(note.id, item.id);
							}}
							aria-label={item.isChecked ? 'Mark as unchecked' : 'Mark as checked'}
						>
							{#if item.isChecked}
								<Check class="w-4 h-4" />
							{:else}
								<div class="w-4 h-4 border-2 rounded" style="border-color: {noteTextColor};"></div>
							{/if}
						</button>
						<span class="flex-1 text-sm">
							{#if item.isChecked}
								<span class="line-through" style="color: {noteTextColor}; opacity: 0.6;">{item.text}</span>
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
	.sticky-note {
		transform: rotate(-0.5deg);
		transform-origin: top left;
		position: relative;
		overflow: visible;
	}

	.sticky-note::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 4px;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.1) 0%,
			rgba(0, 0, 0, 0.02) 50%,
			rgba(0, 0, 0, 0.05) 100%
		);
		pointer-events: none;
		z-index: 0;
	}

	.sticky-note:hover {
		transform: rotate(0deg) scale(1.03) translateY(-4px);
		box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 8px 15px -5px rgba(0, 0, 0, 0.15);
		z-index: 10;
	}

	.sticky-note:hover::before {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.15) 0%,
			rgba(0, 0, 0, 0.03) 50%,
			rgba(0, 0, 0, 0.02) 100%
		);
	}

	.sticky-note:nth-child(even) {
		transform: rotate(0.5deg);
	}

	.sticky-note:nth-child(even):hover {
		transform: rotate(0deg) scale(1.03) translateY(-4px);
	}

	.sticky-note:nth-child(3n) {
		transform: rotate(-0.3deg);
	}

	.sticky-note:nth-child(3n):hover {
		transform: rotate(0deg) scale(1.03) translateY(-4px);
	}

	/* Folded corner */
	.folded-corner {
		box-shadow: -3px 3px 4px rgba(0, 0, 0, 0.1);
	}

	.sticky-note:hover .folded-corner {
		box-shadow: -4px 4px 6px rgba(0, 0, 0, 0.15);
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Custom scrollbar for expanded content */
	:global(.sticky-note .overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}

	:global(.sticky-note .overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.sticky-note .overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.sticky-note .overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	:global(.sticky-note .overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background-color: rgba(0, 0, 0, 0.3);
	}
</style>

<script lang="ts">
	import type { QuickNote } from '../../models/index.js';
	import { marked } from 'marked';
	import { StickyNote, Archive, Trash2, Check, MoreVertical } from 'lucide-svelte';

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

	// Determine text color based on background luminance
	function getContrastColor(hexColor: string): 'dark' | 'light' {
		const hex = hexColor.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.5 ? 'dark' : 'light';
	}

	const textColor = $derived(getContrastColor(note.color || '#fef3c7'));
	const textColorClass = $derived(textColor === 'dark' ? 'text-gray-900' : 'text-gray-100');
	const textColorMutedClass = $derived(textColor === 'dark' ? 'text-gray-700' : 'text-gray-300');
	const textColorStrongClass = $derived(textColor === 'dark' ? 'text-gray-800' : 'text-gray-200');
</script>

<div
	class="sticky-note group relative p-4 rounded-sm shadow-md cursor-pointer transition-all duration-300 ease-out"
	style="background-color: {note.color || '#fef3c7'};"
	onclick={() => onClick?.(note)}
>
	<!-- Tape effect at the top -->
	<div class="tape-effect absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-white/40 backdrop-blur-sm shadow-sm transform -rotate-1 z-10"></div>

	<!-- Folded corner effect -->
	<div class="folded-corner absolute top-0 right-0 w-0 h-0 border-t-[32px] border-r-[32px] border-t-black/5 border-r-transparent z-0"></div>

	{#if note.isPinned}
		<div class="absolute -top-1 right-6 z-20">
			<div class="bg-amber-400 rounded-full p-1 shadow-sm">
				<StickyNote class="h-3 w-3 text-white" />
			</div>
		</div>
	{/if}

	<!-- Delete icon on hover -->
	<button
		class="absolute -top-2 -right-2 z-20 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:scale-110"
		onclick={(e) => {
			e.stopPropagation();
			onDelete?.(note);
		}}
		aria-label="Delete note"
	>
		<Trash2 class="h-3.5 w-3.5 text-gray-600 hover:text-red-600 transition-colors" />
	</button>

	<div class="flex items-start justify-between mb-2">
		{#if note.title}
			<h3 class="font-bold {textColorClass} line-clamp-2 text-sm drop-shadow-sm">{note.title}</h3>
		{/if}
		<div class="relative flex-shrink-0 ml-2" onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }}>
			<button
				class="p-1 rounded hover:bg-black/10 transition-colors {textColorStrongClass}"
				aria-label="More options"
			>
				<MoreVertical class="h-4 w-4" />
			</button>
			{#if showMenu}
				<div class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
					<button
						class="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-800"
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
						class="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-800"
						onclick={(e) => {
							e.stopPropagation();
							onArchive?.(note);
							showMenu = false;
						}}
					>
						<Archive class="h-4 w-4" />
						<span>{note.isArchived ? 'Unarchive' : 'Archive'}</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="markdown-content prose prose-sm max-w-none {textColorStrongClass}">
		{#if !isExpanded}
			<div class="line-clamp-3">
				{@html renderedContent}
			</div>
			{#if note.content.length > 200}
				<button
					class="mt-2 text-xs {textColorMutedClass} hover:underline"
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
		<div class="mt-3 pt-3 border-t border-black/20">
			<div class="flex items-center gap-2 text-xs {textColorMutedClass} mb-2">
				<span>{completedChecklistItems}/{totalChecklistItems} completed</span>
			</div>
			<div class="space-y-1">
				{#each note.checklist as item}
					<div class="flex items-center gap-2">
						<button
							class="flex-shrink-0 p-1 rounded hover:bg-black/10"
							onclick={(e) => {
								e.stopPropagation();
								onToggleChecklist?.(note.id, item.id);
							}}
							aria-label={item.isChecked ? 'Mark as unchecked' : 'Mark as checked'}
						>
							{#if item.isChecked}
								<Check class="h-4 w-4 {textColorStrongClass}" />
							{:else}
								<div class="h-4 w-4 border-2 {textColorStrongClass} rounded"></div>
							{/if}
						</button>
						<span class="text-sm {textColorStrongClass} flex-1">
							{#if item.isChecked}
								<span class="line-through {textColorMutedClass}">{item.text}</span>
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

	/* Tape effect */
	.tape-effect {
		border-radius: 2px;
	}

	.tape-effect::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			90deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.02) 2px,
			rgba(0, 0, 0, 0.02) 4px
		);
		border-radius: 2px;
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

	/* Reset markdown content colors for dark text on light backgrounds */
	.markdown-content a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		transition: opacity 0.2s;
	}

	.markdown-content a:hover {
		opacity: 0.8;
	}

	.markdown-content code {
		background-color: rgba(0, 0, 0, 0.08);
		color: inherit;
	}

	.markdown-content pre {
		background-color: rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: inherit;
	}

	.markdown-content pre code {
		background-color: transparent;
	}

	.markdown-content blockquote {
		border-left-color: rgba(0, 0, 0, 0.2);
		color: inherit;
		opacity: 0.8;
	}

	.markdown-content hr {
		border-top-color: rgba(0, 0, 0, 0.2);
	}

	.markdown-content table th,
	.markdown-content table td {
		border-color: rgba(0, 0, 0, 0.15);
	}

	.markdown-content table th {
		background-color: rgba(0, 0, 0, 0.08);
	}

	.markdown-content table tr:nth-child(even) {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.markdown-content details {
		border-color: rgba(0, 0, 0, 0.15);
	}

	.markdown-content strong {
		color: inherit;
	}
</style>

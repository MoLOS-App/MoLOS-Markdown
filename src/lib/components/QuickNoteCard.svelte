<script lang="ts">
	import type { QuickNote } from '../../models/index.js';
	import { StickyNote, Archive, Trash2, Pin, GripVertical } from 'lucide-svelte';

	interface Props {
		note: QuickNote;
		onClick?: (note: QuickNote) => void;
		onArchive?: (note: QuickNote) => void;
		onDelete?: (note: QuickNote) => void;
		onTogglePin?: (note: QuickNote) => void;
		onReorder?: (sourceId: string, targetId: string) => void;
	}

	let {
		note,
		onClick,
		onArchive,
		onDelete,
		onTogglePin,
		onReorder
	}: Props = $props();

	let draggedId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	const getContrastColor = (hexColor: string): string => {
		const hex = hexColor.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
	};

	const noteBackgroundColor = $derived(note.color || '#fef3c7');
	const noteTextColor = $derived(getContrastColor(noteBackgroundColor));

	function handleDragStart(e: DragEvent, id: string) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}

	function handleDragOver(e: DragEvent, id: string) {
		e.preventDefault();
		if (draggedId === id) return;
		if (dragOverId !== id) {
			dragOverId = id;
		}
	}

	function handleDragLeave(id: string) {
		if (dragOverId === id) {
			dragOverId = null;
		}
	}

	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		const sourceId = draggedId || e.dataTransfer?.getData('text/plain');
		if (!sourceId || sourceId === targetId) {
			draggedId = null;
			dragOverId = null;
			return;
		}
		onReorder?.(sourceId, targetId);
		draggedId = null;
		dragOverId = null;
	}

	function handleDragEnd() {
		draggedId = null;
		dragOverId = null;
	}
</script>

<div
	draggable="true"
	role="listitem"
	class="relative p-4 transition-all duration-300 ease-out rounded-sm shadow-md cursor-pointer sticky-note group flex flex-col {draggedId === note.id
		? 'scale-[0.98] opacity-50 grayscale'
		: ''} {dragOverId === note.id
		? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
		: ''}"
	style="background-color: {noteBackgroundColor}; color: {noteTextColor}; min-height: 140px;"
	ondragstart={(e) => handleDragStart(e, note.id)}
	ondragover={(e) => handleDragOver(e, note.id)}
	ondragleave={() => handleDragLeave(note.id)}
	ondragend={handleDragEnd}
	ondrop={(e) => handleDrop(e, note.id)}
	onclick={() => onClick?.(note)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(note);
		}
	}}
	tabindex="0"
>
	<div class="absolute top-0 right-0 z-0 w-0 h-0 folded-corner border-t-32 border-r-32 border-r-transparent" style="border-top-color: {noteTextColor}; opacity: 0.05;"></div>

	<!-- Drag handle -->
	<div class="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing hover:!opacity-100">
		<GripVertical class="w-4 h-4" style="color: {noteTextColor};" />
	</div>

	{#if note.isPinned}
		<div class="absolute z-20 -top-1 right-6">
			<div class="p-1 rounded-full shadow-sm bg-amber-400">
				<StickyNote class="w-3 h-3" />
			</div>
		</div>
	{/if}

	<div class="flex-1 relative z-10 pl-4">
		{#if note.title}
			<h3 class="text-sm font-bold line-clamp-2 drop-shadow-sm mb-2">{note.title}</h3>
		{/if}

		<div class="prose-sm prose whitespace-pre-wrap max-w-none line-clamp-3">
			{note.content}
		</div>
	</div>

	<div
		class="flex items-center justify-center gap-2 mt-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10"
		onclick={(e) => e.stopPropagation()}
	>
		<button
			class="p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
			style="background-color: {note.isPinned ? 'var(--warning)' : 'rgba(0,0,0,0.1)'};"
			onclick={(e) => {
				e.stopPropagation();
				onTogglePin?.(note);
			}}
			aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
			type="button"
		>
			<Pin class="h-3.5 w-3.5" style="color: {note.isPinned ? 'white' : noteTextColor};" />
		</button>
		<button
			class="p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
			style="background-color: rgba(0,0,0,0.1);"
			onclick={(e) => {
				e.stopPropagation();
				onArchive?.(note);
			}}
			aria-label={note.isArchived ? 'Unarchive note' : 'Archive note'}
			type="button"
		>
			<Archive class="h-3.5 w-3.5" style="color: {noteTextColor};" />
		</button>
		<button
			class="p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
			style="background-color: rgba(0,0,0,0.1);"
			onclick={(e) => {
				e.stopPropagation();
				onDelete?.(note);
			}}
			aria-label="Delete note"
			type="button"
		>
			<Trash2 class="h-3.5 w-3.5" style="color: var(--destructive);" />
		</button>
	</div>
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
</style>

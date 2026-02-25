<script lang="ts">
	import type { NoteColor } from '../../models/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Palette, X } from 'lucide-svelte';

	interface Props {
		selectedColor?: NoteColor;
		onSelect: (color: NoteColor) => void;
	}

	let { selectedColor, onSelect }: Props = $props();

	const colors: { value: NoteColor; label: string; bgClass: string }[] = [
		{ value: 'default', label: 'Default', bgClass: 'bg-white border-gray-200' },
		{ value: 'red', label: 'Red', bgClass: 'bg-red-100 border-red-200' },
		{ value: 'orange', label: 'Orange', bgClass: 'bg-orange-100 border-orange-200' },
		{ value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-100 border-yellow-200' },
		{ value: 'green', label: 'Green', bgClass: 'bg-green-100 border-green-200' },
		{ value: 'teal', label: 'Teal', bgClass: 'bg-teal-100 border-teal-200' },
		{ value: 'blue', label: 'Blue', bgClass: 'bg-blue-100 border-blue-200' },
		{ value: 'dark-blue', label: 'Dark Blue', bgClass: 'bg-blue-900/20 border-blue-900/40' },
		{ value: 'purple', label: 'Purple', bgClass: 'bg-purple-100 border-purple-200' },
		{ value: 'pink', label: 'Pink', bgClass: 'bg-pink-100 border-pink-200' },
		{ value: 'brown', label: 'Brown', bgClass: 'bg-amber-100 border-amber-200' },
		{ value: 'gray', label: 'Gray', bgClass: 'bg-gray-100 border-gray-200' }
	];
</script>

<div class="flex items-center gap-2">
	<Palette class="h-4 w-4 text-gray-500" />
	<div class="flex gap-1.5">
		{#each colors as color}
			<button
				class="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 {color.bgClass} {selectedColor === color.value ? 'ring-2 ring-offset-1 ring-black/50' : 'hover:opacity-80'}"
				class:border-gray-300
				aria-label={color.label}
				onclick={() => onSelect(color.value)}
			>
				{#if selectedColor === color.value}
					<div class="absolute inset-0 flex items-center justify-center">
						<X class="h-4 w-4 text-black" />
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>

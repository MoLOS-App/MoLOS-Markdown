<script lang="ts">
	import { X, Sparkles, Edit3, Hash, Check, AlertTriangle } from 'lucide-svelte';
	import type { CreateQuickNoteInput } from '../../models/index.js';
	import ColorPicker from '$lib/components/shared/color-picker.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		onCreate: (data: CreateQuickNoteInput) => void;
		onClose: () => void;
		initialData?: Partial<CreateQuickNoteInput>;
		isEditing?: boolean;
	}

	let { onCreate, onClose, initialData = {}, isEditing = false }: Props = $props();

	let title = $state<string | undefined>('');
	let color = $state<string | undefined>('#fef3c7');
	let content = $state('');
	let labels = $state<string[]>([]);
	let labelInput = $state('');
	let contentEl: HTMLDivElement | undefined;
	let hasUnsavedChanges = $state(false);
	let isOpen = $state(false);
	let focusedField = $state<'title' | 'content' | 'labels' | null>(null);
	let showDiscardDialog = $state(false);

	const MAX_CONTENT_LENGTH = 10000;
	const contentLength = $derived(content.length);
	const isOverLimit = $derived(contentLength > MAX_CONTENT_LENGTH);

	// Color to note style mapping - creates cohesive note appearance
	const noteStyles: Record<string, { bg: string; text: string; border: string; accent: string }> = {
		'#fef3c7': { bg: '#fef3c7', text: '#78350f', border: '#fcd34d', accent: '#d97706' },
		'#fecaca': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', accent: '#dc2626' },
		'#fca5a5': { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8', accent: '#db2777' },
		'#f0ef86': { bg: '#fef9c3', text: '#854d0e', border: '#fde047', accent: '#ca8a04' },
		'#e1f5c4': { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', accent: '#16a34a' },
		'#dbeafe': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', accent: '#2563eb' },
		'#c3ddfd': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', accent: '#4f46e5' },
		'#a0dce8': { bg: '#cffafe', text: '#0e7490', border: '#a5f3fc', accent: '#0891b2' },
		'#a2d2ff': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', accent: '#0284c7' },
		'#c4bef0': { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff', accent: '#9333ea' },
		'#fdffb6': { bg: '#fefce8', text: '#713f12', border: '#fef08a', accent: '#a16207' },
		'#d1d5db': { bg: '#f9fafb', text: '#374151', border: '#e5e7eb', accent: '#6b7280' },
		'#ffffff': { bg: '#ffffff', text: '#1f2937', border: '#e5e7eb', accent: '#6b7280' }
	};

	const currentStyle = $derived(noteStyles[color || '#fef3c7'] || noteStyles['#fef3c7']);

	$effect(() => {
		if (initialData) {
			title = initialData.title;
			color = initialData.color || '#fef3c7';
			content = initialData.content ?? '';
			labels = initialData.labels ?? [];
		}
	});

	// Animate in on mount
	$effect(() => {
		requestAnimationFrame(() => {
			isOpen = true;
		});
		// Focus content after animation
		setTimeout(() => {
			contentEl?.focus();
		}, 200);
	});

	// Track unsaved changes
	$effect(() => {
		if (content || title || labels.length > 0) {
			hasUnsavedChanges = true;
		} else {
			hasUnsavedChanges = false;
		}
	});

	function addLabel() {
		const trimmed = labelInput.trim();
		if (trimmed && !labels.includes(trimmed) && labels.length < 10) {
			labels = [...labels, trimmed];
			labelInput = '';
		}
	}

	function removeLabel(label: string) {
		labels = labels.filter((l) => l !== label);
	}

	function handleCreate() {
		if (!content.trim() || isOverLimit) return;

		onCreate({
			title,
			content,
			color,
			labels,
			checklist: []
		});
		hasUnsavedChanges = false;
	}

	function handleClose() {
		if (hasUnsavedChanges) {
			showDiscardDialog = true;
			return;
		}
		performClose();
	}

	function performClose() {
		isOpen = false;
		setTimeout(onClose, 200);
	}

	function confirmDiscard() {
		showDiscardDialog = false;
		hasUnsavedChanges = false;
		performClose();
	}

	function cancelDiscard() {
		showDiscardDialog = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleCreate();
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	// Handle content editable input
	function handleContentInput(e: Event) {
		const target = e.target as HTMLDivElement;
		content = target.innerText || '';
	}

	// Sync content to contenteditable on initial load
	$effect(() => {
		if (contentEl && content && contentEl.innerText !== content) {
			contentEl.innerText = content;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop with blur -->
<div
	class="fixed inset-0 z-50 flex items-start justify-center pt-[3vh] sm:pt-[8vh] px-3 sm:px-4 transition-all duration-300 ease-out {isOpen
		? 'bg-black/50 backdrop-blur-sm opacity-100'
		: 'bg-transparent opacity-0 pointer-events-none'}"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="note-dialog-title"
>
	<!-- Note Card -->
	<div
		class="w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl transition-all duration-300 ease-out transform relative flex flex-col {isOpen
			? 'opacity-100 scale-100 translate-y-0'
			: 'opacity-0 scale-95 translate-y-6'}"
		style="
			background: linear-gradient(145deg, {currentStyle.bg}, {currentStyle.bg}dd);
			color: {currentStyle.text};
			box-shadow: 
				0 25px 50px -12px rgba(0, 0, 0, 0.25),
				0 0 0 1px {currentStyle.border}50,
				inset 0 1px 0 rgba(255,255,255,0.3);
		"
	>

		<!-- Header Bar -->
		<div
			class="relative flex items-center justify-between px-4 sm:px-5 py-2.5 border-b transition-colors duration-200"
			style="border-color: {currentStyle.border}40;"
		>
			<div class="flex items-center gap-2.5">
				<div
					class="p-1.5 rounded-lg transition-transform duration-200 hover:scale-110"
					style="background: {currentStyle.accent}20;"
				>
					{#if isEditing}
						<Edit3 class="w-3.5 h-3.5" style="color: {currentStyle.accent};" />
					{:else}
						<Sparkles class="w-3.5 h-3.5" style="color: {currentStyle.accent};" />
					{/if}
				</div>
				<span id="note-dialog-title" class="text-xs font-semibold tracking-wide uppercase opacity-70">
					{isEditing ? 'Edit' : 'New Note'}
				</span>
			</div>

			<div class="flex items-center gap-1.5">
				<!-- Color Picker -->
				<div class="scale-90 origin-center">
					<ColorPicker selected={color} onSelect={(c) => (color = c)} size="sm" />
				</div>

				<!-- Close Button -->
				<button
					type="button"
					onclick={handleClose}
					class="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2"
					style="--tw-ring-color: {currentStyle.accent}40;"
					aria-label="Close"
				>
					<X class="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" />
				</button>
			</div>
		</div>

		<!-- Note Content Area -->
		<div class="relative p-4 sm:p-5 space-y-1">
			<!-- Title Field - Seamless -->
			<div
				class="group -mx-1 px-1 py-0.5 -mt-1 rounded-lg transition-all duration-200 {focusedField ===
				'title'
					? 'ring-2 ring-inset'
					: 'hover:bg-black/5'}"
				style="--tw-ring-color: {currentStyle.accent}30;"
			>
				<input
					bind:value={title}
					placeholder="Title"
					class="w-full bg-transparent text-lg sm:text-xl font-bold placeholder:opacity-35 focus:outline-none transition-all duration-150"
					style="color: {currentStyle.text};"
					onfocus={() => (focusedField = 'title')}
					onblur={() => (focusedField = null)}
				/>
			</div>

			<!-- Content Field - Seamless contenteditable -->
			<div
				class="group -mx-1 px-1 py-1 rounded-lg transition-all duration-200 {focusedField === 'content'
					? 'ring-2 ring-inset'
					: 'hover:bg-black/5'}"
				style="--tw-ring-color: {currentStyle.accent}30;"
			>
				<div
					bind:this={contentEl}
					contenteditable="true"
					class="w-full min-h-[180px] max-h-[45vh] overflow-y-auto bg-transparent text-sm sm:text-base leading-relaxed placeholder:opacity-35 focus:outline-none whitespace-pre-wrap break-words"
					style="color: {currentStyle.text};"
					onfocus={() => (focusedField = 'content')}
					onblur={() => (focusedField = null)}
					oninput={handleContentInput}
					role="textbox"
					aria-multiline="true"
					aria-label="Note content"
					data-placeholder="Start typing..."
				></div>

				<!-- Character count - subtle, appears on focus -->
				<div
					class="flex justify-end mt-1.5 text-[10px] tabular-nums transition-all duration-200 {focusedField ===
					'content'
						? 'opacity-50'
						: 'opacity-0'}"
				>
					<span class={isOverLimit ? 'text-red-600 font-semibold' : ''}>
						{contentLength}/{MAX_CONTENT_LENGTH}
					</span>
				</div>
			</div>

			<!-- Labels Row - Seamless inline -->
			<div
				class="group -mx-1 px-1 py-1.5 -mb-1 rounded-lg transition-all duration-200 {focusedField ===
				'labels'
					? 'ring-2 ring-inset'
					: 'hover:bg-black/5'}"
				style="--tw-ring-color: {currentStyle.accent}30;"
			>
				<div class="flex items-center gap-1.5 flex-wrap">
					<Hash class="w-3 h-3 opacity-40 flex-shrink-0" />

					<!-- Existing labels -->
					{#each labels as label}
						<span
							class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-200 hover:shadow-sm"
							style="background: {currentStyle.accent}18; border: 1px solid {currentStyle.accent}30;"
						>
							<span class="max-w-[80px] truncate">{label}</span>
							<button
								type="button"
								onclick={() => removeLabel(label)}
								class="p-0.5 -mr-0.5 rounded-full transition-colors hover:bg-black/10"
								aria-label="Remove {label}"
							>
								<X class="w-2.5 h-2.5" />
							</button>
						</span>
					{/each}

					<!-- Label input -->
					{#if labels.length < 10}
						<input
							bind:value={labelInput}
							onkeydown={(e) => {
								if (e.key === 'Enter' && labelInput.trim()) {
									e.preventDefault();
									addLabel();
								}
							}}
							onfocus={() => (focusedField = 'labels')}
							onblur={() => {
								focusedField = null;
								if (labelInput.trim()) addLabel();
							}}
							placeholder={labels.length === 0 ? 'Add label...' : '+'}
							class="bg-transparent text-[11px] focus:outline-none placeholder:opacity-35 w-auto min-w-[50px] flex-shrink-0"
							style="color: {currentStyle.text};"
						/>
					{/if}

					<!-- Label count badge -->
					{#if labels.length > 0}
						<span
							class="text-[9px] px-1.5 py-0.5 rounded-full ml-auto opacity-40"
							style="background: {currentStyle.accent}15;"
						>
							{labels.length}/10
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer - Actions -->
		<div
			class="relative flex items-center justify-between px-4 sm:px-5 py-2.5 border-t transition-colors duration-200"
			style="border-color: {currentStyle.border}30;"
		>
			<!-- Keyboard hint -->
			<div class="hidden sm:flex items-center gap-1 text-[10px] opacity-40">
				<kbd
					class="px-1 py-0.5 rounded font-mono"
					style="background: {currentStyle.accent}12;"
				>
					⌘
				</kbd>
				<span>+</span>
				<kbd
					class="px-1 py-0.5 rounded font-mono"
					style="background: {currentStyle.accent}12;"
				>
					↵
				</kbd>
			</div>
			<div class="sm:hidden"></div>

			<!-- Action buttons -->
			<div class="flex items-center gap-2 ml-auto">
				<button
					type="button"
					onclick={handleClose}
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:bg-black/8 opacity-60 hover:opacity-100"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleCreate}
					disabled={!content.trim() || isOverLimit}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
					style="background: {currentStyle.accent}; color: white;"
				>
					{#if isEditing}
						<Check class="w-3 h-3" />
						Save
					{:else}
						<Sparkles class="w-3 h-3" />
						Create
					{/if}
				</button>
			</div>
		</div>

		<!-- Subtle bottom shadow line -->
		<div
			class="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-30"
			style="background: linear-gradient(90deg, transparent, {currentStyle.border}, transparent);"
		></div>
	</div>
</div>

<!-- Discard Changes Alert Dialog -->
<AlertDialog.Root bind:open={showDiscardDialog}>
	<AlertDialog.Content class="max-w-sm">
		<AlertDialog.Header>
			<div class="flex items-center gap-3">
				<div class="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
					<AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
				</div>
				<AlertDialog.Title class="text-lg">Discard changes?</AlertDialog.Title>
			</div>
		</AlertDialog.Header>
		<AlertDialog.Description class="text-muted-foreground">
			You have unsaved changes. If you close now, your changes will be lost.
		</AlertDialog.Description>
		<AlertDialog.Footer class="gap-2 sm:gap-0">
			<AlertDialog.Cancel asChild let:builder>
				<Button variant="outline" {...builder} onclick={cancelDiscard}>
					Keep editing
				</Button>
			</AlertDialog.Cancel>
			<AlertDialog.Action asChild let:builder>
				<Button variant="destructive" {...builder} onclick={confirmDiscard}>
					Discard
				</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	/* Placeholder for contenteditable */
	[contenteditable]:empty:before {
		content: attr(data-placeholder);
		opacity: 0.35;
		pointer-events: none;
	}

	/* Smooth scrollbar for content */
	[contenteditable]::-webkit-scrollbar {
		width: 5px;
	}

	[contenteditable]::-webkit-scrollbar-track {
		background: transparent;
	}

	[contenteditable]::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.12);
		border-radius: 3px;
	}

	[contenteditable]::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.2);
	}

	/* Focus ring animation */
	.group:focus-within {
		animation: focus-pulse 0.2s ease-out;
	}

	@keyframes focus-pulse {
		0% {
			opacity: 0.7;
		}
		100% {
			opacity: 1;
		}
	}

	/* Button press effect */
	button:active:not(:disabled) {
		transform: scale(0.97);
	}
</style>

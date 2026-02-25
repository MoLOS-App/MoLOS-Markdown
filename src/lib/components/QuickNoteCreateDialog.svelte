<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { StickyNote, Plus, X, Keyboard } from 'lucide-svelte';
	import type { CreateQuickNoteInput } from '../../models/index.js';
	import ColorPicker from '$lib/components/shared/color-picker.svelte';

	interface Props {
		onCreate: (data: CreateQuickNoteInput) => void;
		onClose: () => void;
		initialData?: Partial<CreateQuickNoteInput>;
		isEditing?: boolean;
	}

	let { onCreate, onClose, initialData = {}, isEditing = false }: Props = $props();

	let title = $state<string | undefined>('');
	let color = $state<string | undefined>();
	let content = $state('');
	let labels = $state<string[]>([]);
	let labelInput = $state('');
	let contentTextarea: HTMLTextAreaElement | undefined;
	let hasUnsavedChanges = $state(false);

	$effect(() => {
		if (initialData) {
			title = initialData.title;
			color = initialData.color;
			content = initialData.content ?? '';
			labels = initialData.labels ?? [];
		}
	});

	// Track unsaved changes
	$effect(() => {
		if (content || title || labels.length > 0) {
			hasUnsavedChanges = true;
		} else {
			hasUnsavedChanges = false;
		}
	});

	// Autofocus content field when dialog opens
	$effect(() => {
		if (contentTextarea) {
			contentTextarea.focus();
		}
	});

	function addLabel() {
		if (labelInput.trim() && !labels.includes(labelInput.trim())) {
			labels = [...labels, labelInput.trim()];
			labelInput = '';
		}
	}

	function removeLabel(label: string) {
		labels = labels.filter(l => l !== label);
	}

	function handleCreate() {
		if (!content.trim()) return;

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
			const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
			if (!confirmed) return;
		}
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleCreate();
		}
	}
</script>

<Dialog.Root open={true} onOpenChange={() => onClose()}>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-3">
				<div class="p-2 bg-emerald-500/10 rounded-lg">
					{#if isEditing}
						<StickyNote class="h-5 w-5 text-emerald-500" />
					{:else}
						<Plus class="h-5 w-5 text-emerald-500" />
					{/if}
				</div>
				<div>
					{isEditing ? 'Edit Note' : 'New Note'}
				</div>
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="flex items-end gap-3">
				<div class="flex-1">
					<Label for="title">Title</Label>
					<Input
						id="title"
						bind:value={title}
						placeholder="Optional"
					/>
				</div>
				<div>
					<Label>Color</Label>
					<ColorPicker selected={color} onSelect={(c) => color = c} size="sm" />
				</div>
			</div>

			<div>
				<Label>Labels</Label>
				<div class="flex flex-wrap gap-1 mb-2">
					{#each labels as label}
						<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
							{label}
							<button onclick={() => removeLabel(label)} class="hover:text-destructive">
								<X class="h-3 w-3" />
							</button>
						</span>
					{/each}
				</div>
				<Input
					bind:value={labelInput}
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
					placeholder="Add label..."
				/>
			</div>

			<div class="flex-1">
				<Label for="content">Content <span class="text-muted-foreground text-xs font-normal">(Markdown supported)</span></Label>
				<div class="relative">
					<Textarea
						id="content"
						bind:value={content}
						bind:this={contentTextarea}
						placeholder="Write your note...&#10;&#10;Supports Markdown:&#10;**bold**, *italic*, `code`&#10;- lists&#10;# headings"
						class="min-h-[350px] resize-y"
						onkeydown={handleKeydown}
					/>
					<div class="absolute bottom-2 right-2 flex items-center gap-2">
						<div class="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
							<Keyboard class="h-3 w-3" />
							<span>Ctrl/Cmd+Enter to save</span>
						</div>
						<div class="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
							{content.length} chars
						</div>
					</div>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleCreate} disabled={!content.trim()}>
				{isEditing ? 'Save' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { StickyNote, Plus, Trash2, Check, X } from 'lucide-svelte';
	import type { QuickNoteChecklistItem, NoteColor, CreateQuickNoteInput } from '../../models/index.js';
	import { marked } from 'marked';
	import ColorPicker from './ColorPicker.svelte';

	interface Props {
		onCreate: (data: CreateQuickNoteInput) => void;
		onClose: () => void;
		initialData?: Partial<CreateQuickNoteInput>;
		isEditing?: boolean;
	}

	let { onCreate, onClose, initialData = {}, isEditing = false }: Props = $props();

	let formData = $state<CreateQuickNoteInput>({
		content: '',
		title: undefined,
		color: undefined,
		labels: [],
		checklist: []
	});

	$effect(() => {
		if (initialData) {
			formData.content = initialData.content ?? '';
			formData.title = initialData.title;
			formData.color = initialData.color;
			formData.labels = initialData.labels ?? [];
			formData.checklist = initialData.checklist ?? [];
		}
	});

	let tagInput = $state('');

	const renderedPreview = $derived(marked(formData.content));

	function addTag() {
		if (tagInput.trim() && !formData.labels.includes(tagInput.trim())) {
			formData = {
				...formData,
				labels: [...formData.labels, tagInput.trim()]
			};
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		formData = {
			...formData,
			labels: formData.labels.filter(t => t !== tagToRemove)
		};
	}

	function addChecklistItem() {
		const newItem: QuickNoteChecklistItem = {
			id: `item-${Date.now()}`,
			text: '',
			isChecked: false,
			sortOrder: formData.checklist.length
		};
		formData = {
			...formData,
			checklist: [...formData.checklist, newItem]
		};
	}

	function updateChecklistItem(id: string, text: string) {
		formData = {
			...formData,
			checklist: formData.checklist.map(item =>
				item.id === id ? { ...item, text } : item
			)
		};
	}

	function toggleChecklistItem(id: string) {
		formData = {
			...formData,
			checklist: formData.checklist.map(item =>
				item.id === id ? { ...item, isChecked: !item.isChecked } : item
			)
		};
	}

	function removeChecklistItem(id: string) {
		formData = {
			...formData,
			checklist: formData.checklist.filter(item => item.id !== id)
		};
	}

	function handleCreate() {
		if (!formData.content.trim()) return;

		onCreate(formData);
		onClose();
	}
</script>

<Dialog.Root open={true} onOpenChange={(o) => o && onClose()}>
	<Dialog.Content class="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
					{isEditing ? 'Edit Note' : 'Create New Note'}
					<p class="text-xs sm:text-sm font-normal text-muted-foreground mt-0.5">
						{#if isEditing}
							Update your note with markdown and checklist support
						{:else}
							Capture your thoughts quickly
						{/if}
					</p>
				</div>
			</Dialog.Title>
		</Dialog.Header>

		<Dialog.Body class="space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-3">
					<Label for="title">Title</Label>
					<Input
						id="title"
						bind:value={formData.title}
						placeholder="Note title (optional)"
						class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
					/>

					<Label>Color</Label>
					<ColorPicker selectedColor={formData.color} onSelect={(c) => formData = { ...formData, color: c }} />

					<Label>Labels</Label>
					<div class="flex gap-2">
						<Input
							bind:value={tagInput}
							onkeypress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
							placeholder="Add label..."
							class="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
						/>
						<Button size="sm" variant="outline" onclick={addTag}>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
					{#if formData.labels.length > 0}
						<div class="flex flex-wrap gap-1.5 mt-2">
							{#each formData.labels as tag}
								<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium">
									{tag}
									<button
										class="hover:bg-destructive/20 rounded-full p-0.5 transition-colors ml-1"
										onclick={() => removeTag(tag)}
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="space-y-3">
					<Label for="content">Content <span class="text-muted-foreground font-normal">(Markdown supported)</span></Label>
					<div class="relative">
						<Textarea
							id="content"
							bind:value={formData.content}
							placeholder="Write your note..."
							class="font-mono text-xs sm:text-sm resize-none min-h-[200px]"
						/>
						<div class="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-muted-foreground">
							{formData.content.split(/\s+/).filter(x => x).length} words
						</div>
					</div>

					<Label>Checklist</Label>
					<div class="space-y-2">
						{#if formData.checklist.length > 0}
							{#each formData.checklist as item, i}
								<div class="flex items-center gap-2">
									<button
										class="flex-shrink-0 p-1 rounded hover:bg-black/5"
										onclick={() => toggleChecklistItem(item.id)}
										aria-label={item.isChecked ? 'Mark as unchecked' : 'Mark as checked'}
									>
										{#if item.isChecked}
											<Check class="h-4 w-4 text-green-600" />
										{:else}
											<div class="h-4 w-4 border-2 border-gray-300 rounded" />
										{/if}
									</button>
									<Input
										class="flex-1 h-8 text-sm"
										value={item.text}
										oninput={(e) => updateChecklistItem(item.id, e.target.value)}
										placeholder="Checklist item..."
									/>
									<Button
										size="icon"
										variant="ghost"
										class="flex-shrink-0 text-red-500 hover:text-red-700"
										onclick={() => removeChecklistItem(item.id)}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							{/each}
						{:else}
							<Button
								variant="outline"
								class="w-full py-6 text-muted-foreground hover:text-foreground"
								onclick={addChecklistItem}
							>
								<Plus class="h-4 w-4 mr-2" />
								Add checklist item
							</Button>
						{/if}
					</div>
				</div>
			</div>

			{#if formData.content.length > 0}
				<div class="pt-4 border-t border-gray-200">
					<Label class="mb-2 block">Preview</Label>
					<div class="p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm max-w-none">
						{@html renderedPreview}
					</div>
				</div>
			{/if}
		</Dialog.Body>

		<Dialog.Footer class="flex-col sm:flex-row gap-2">
			<Button variant="outline" onclick={onClose} class="w-full sm:w-auto">Cancel</Button>
			<Button onclick={handleCreate} disabled={!formData.content.trim()} class="w-full sm:w-auto">
				{isEditing ? 'Save Changes' : 'Create Note'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

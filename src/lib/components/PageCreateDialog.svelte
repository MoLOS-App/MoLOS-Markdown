<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { FileText, FolderOpen, X, Plus } from "lucide-svelte";

	interface Props {
		existingPaths: string[];
		onCreate: (data: { title: string; path: string; tags?: string[] }) => void;
		onClose: () => void;
	}

	let { existingPaths, onCreate, onClose }: Props = $props();

	let formData = $state({
		title: "",
		pathPrefix: "",
		tags: [] as string[]
	});

	let tagInput = $state("");
	let showSuggestions = $state(false);

	// Generate slug from title
	const slug = $derived(
		formData.title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
	);

	// Full path with slug appended
	const fullPath = $derived((() => {
		const prefix = formData.pathPrefix || "";
		const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
		return slug ? `${base}/${slug}` : base;
	})());

	// All unique parent directories from existing paths
	const allParentDirs = $derived((() => {
		const parentDirs = new Set<string>(["/"]);
		for (const path of existingPaths) {
			const parts = path.split("/").filter(Boolean);
			for (let i = 1; i <= parts.length; i++) {
				parentDirs.add("/" + parts.slice(0, i).join("/"));
			}
		}
		return Array.from(parentDirs).sort();
	})());

	// Filtered suggestions based on current input
	const filteredSuggestions = $derived((() => {
		if (!formData.pathPrefix) {
			return allParentDirs.slice(0, 8);
		}
		const input = formData.pathPrefix.toLowerCase();
		return allParentDirs.filter(path =>
			path.toLowerCase().includes(input) || input.includes(path.toLowerCase())
		).slice(0, 8);
	})());

	function selectPath(path: string) {
		formData.pathPrefix = path;
		showSuggestions = false;
	}

	function addTag() {
		if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
			formData.tags = [...formData.tags, tagInput.trim()];
			tagInput = "";
		}
	}

	function removeTag(tagToRemove: string) {
		formData.tags = formData.tags.filter(t => t !== tagToRemove);
	}

	function handlePathFocus() {
		showSuggestions = true;
	}

	function handlePathBlur() {
		// Delay hiding to allow clicking on suggestions
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	function handlePathInput(e: Event) {
		const input = e.target as HTMLInputElement;
		formData.pathPrefix = input.value;
	}

	function handlePathKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showSuggestions = false;
		}
	}

	function handleCreate() {
		if (!formData.title.trim()) return;

		onCreate({
			title: formData.title.trim(),
			path: fullPath || "/" + slug,
			tags: formData.tags
		});
		onClose();
	}
</script>

<Dialog.Root open={true} onOpenChange={(o) => o && onClose()}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-3">
				<div class="p-2 bg-emerald-500/10 rounded-lg">
					<FileText class="h-5 w-5 text-emerald-500" />
				</div>
				<div>
					Create New Page
					<p class="text-sm font-normal text-muted-foreground mt-0.5">Enter the page details below</p>
				</div>
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Title -->
			<div>
				<Label for="title" class="text-sm font-medium">Title *</Label>
				<Input
					id="title"
					bind:value={formData.title}
					placeholder="Page title"
					class="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<!-- Path with autocomplete and dynamic slug -->
			<div>
				<Label for="path" class="text-sm font-medium">Path</Label>
				<div class="relative mt-1.5">
					<Input
						id="path"
						value={formData.pathPrefix}
						placeholder="/docs"
						class="font-mono text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-24"
						onfocus={handlePathFocus}
						onblur={handlePathBlur}
						oninput={handlePathInput}
						onkeydown={handlePathKeydown}
					/>
					<!-- Slug preview -->
					{#if slug}
						<div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
							/{slug}
						</div>
					{/if}
					{#if showSuggestions && filteredSuggestions.length > 0}
						<div class="absolute z-50 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-lg overflow-hidden">
							{#each filteredSuggestions as suggestion}
								<button
									onclick={() => selectPath(suggestion)}
									class="w-full text-left px-3 py-2 text-sm font-mono hover:bg-accent/50 transition-colors flex items-center gap-2"
								>
									<FolderOpen class="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
									<span>{suggestion}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground mt-1">
					Full path: <span class="font-mono">{fullPath || "/" + slug}</span>
				</p>
			</div>

			<!-- Tags -->
			<div>
				<Label for="tags" class="text-sm font-medium">Tags</Label>
				<div class="flex gap-2 mt-1.5">
					<Input
						id="tags"
						bind:value={tagInput}
						onkeypress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
						placeholder="Add tag..."
						class="flex-1 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
					/>
					<Button size="sm" variant="outline" onclick={addTag} class="shrink-0">
						<Plus class="h-3 w-3" />
					</Button>
				</div>
				{#if formData.tags.length > 0}
					<div class="flex flex-wrap gap-1.5 mt-2">
						{#each formData.tags as tag}
							<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium">
								{tag}
								<button
									onclick={() => removeTag(tag)}
									class="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<Dialog.Footer class="flex gap-2">
			<Button variant="outline" onclick={onClose}>Cancel</Button>
			<Button
				onclick={handleCreate}
				disabled={!formData.title.trim()}
			>
				Create Page
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

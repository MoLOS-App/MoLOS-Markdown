<script lang="ts">
	import type { MarkdownPage } from "../models";
	import { FileText, Copy, Star } from "lucide-svelte";

	interface Props {
		pages: MarkdownPage[];
		templates?: MarkdownPage[];
		selectedPage: string | null;
		onSelect: (pageId: string) => void;
	}

	let { pages, templates, selectedPage, onSelect }: Props = $props();

	const templateList = $derived(templates ?? []);
</script>

<div class="p-2 space-y-1">
	{#if templateList.length > 0}
		<div class="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
			Templates
		</div>
		{#each templateList as template}
			<button
				onclick={() => onSelect(template.id)}
				class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors hover:bg-muted"
				class:bg-accent={selectedPage === template.id}
			>
				<Copy class="h-3 w-3 text-muted-foreground" />
				<span class="flex-1 truncate">{template.title}</span>
			</button>
		{/each}
	{/if}

	<div class="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
		Pages
	</div>
	{#each pages as page}
		<button
			onclick={() => onSelect(page.id)}
			class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors hover:bg-muted"
			class:bg-accent={selectedPage === page.id}
		>
			<FileText class="h-3 w-3 text-muted-foreground" />
			<span class="flex-1 truncate">{page.title}</span>
			{#if page.isTemplate}
				<Star class="h-3 w-3 text-amber-500" />
			{/if}
		</button>
	{/each}

	{#if pages.length === 0 && templateList.length === 0}
		<div class="px-2 py-4 text-center text-sm text-muted-foreground">
			No pages yet
		</div>
	{/if}
</div>

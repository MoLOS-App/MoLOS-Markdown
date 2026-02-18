<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { BookOpen, FileText, FolderOpen, Search } from "lucide-svelte";

	interface Props {
		type?: "no-pages" | "no-search-results" | "no-selection";
		title?: string;
		description?: string;
		icon?: "book" | "file" | "folder" | "search";
		actionLabel?: string;
		onAction?: () => void;
	}

	let {
		type = "no-pages",
		title,
		description,
		icon,
		actionLabel = "Create Page",
		onAction
	}: Props = $props();

	const defaultConfig = $derived(() => {
		switch (type) {
			case "no-search-results":
				return {
					title: title || "No Results Found",
					description: description || "Try adjusting your search terms",
					icon: icon || "search"
				};
			case "no-selection":
				return {
					title: title || "Select a Page",
					description: description || "Choose a page from the sidebar to view its contents",
					icon: icon || "file"
				};
			default:
				return {
					title: title || "Markdown Documents",
					description: description || "Create documentation, notes, and knowledge base pages",
					icon: icon || "book"
				};
		}
	});

	const iconComponent = $derived(() => {
		switch (defaultConfig().icon) {
			case "file": return FileText;
			case "folder": return FolderOpen;
			case "search": return Search;
			default: return BookOpen;
		}
	});

	const Icon = iconComponent();
</script>

<div class="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
	<!-- Animated Icon with Blur Glow -->
	<div class="relative mb-6 inline-flex">
		<div class="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
		<div class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg ring-2 ring-white/20">
			<Icon class="h-10 w-10 text-white" />
		</div>
	</div>

	<!-- Title -->
	<h3 class="text-2xl font-bold mb-2 tracking-tight">{defaultConfig().title}</h3>

	<!-- Description -->
	<p class="text-muted-foreground text-sm mb-6 leading-relaxed">
		{defaultConfig().description}
	</p>

	<!-- Action Button (if provided) -->
	{#if onAction}
		<Button onclick={onAction} class="shadow-md hover:shadow-lg transition-all duration-200">
			{actionLabel}
		</Button>
	{/if}

	<!-- Optional Slot -->
	<slot />
</div>

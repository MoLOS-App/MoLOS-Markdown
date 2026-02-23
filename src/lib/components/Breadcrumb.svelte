<script lang="ts">
	import { Home, ChevronRight } from "lucide-svelte";

	interface Props {
		path: string;
		onNavigate: (path: string) => void;
	}

	let { path, onNavigate }: Props = $props();

	const segments = $derived(() => {
		if (path === "/") return [];
		return path.split("/").filter(Boolean);
	});

	function buildPathToSegment(index: number): string {
		return "/" + segments.slice(0, index + 1).join("/");
	}
</script>

<nav class="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
	<button
		onclick={() => onNavigate("/")}
		class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200 font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
		class:text-foreground={path === "/"}
	>
		<Home class="h-4 w-4" />
		<span>Root</span>
	</button>

	{#each segments as segment, i}
		<ChevronRight class="h-4 w-4 text-muted-foreground/50" />
		<button
			onclick={() => onNavigate(buildPathToSegment(i))}
			class="px-2.5 py-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
			class:text-foreground={i === segments.length - 1}
			class:font-semibold={i === segments.length - 1}
		>
			{segment}
		</button>
	{/each}
</nav>

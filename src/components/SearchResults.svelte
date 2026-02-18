<script lang="ts">
	import type { MarkdownPage } from "../models";
	import { Badge } from "$lib/components/ui/badge";
	import { FileText, Folder } from "lucide-svelte";

	interface Props {
		results: Array<{
			page: MarkdownPage;
			matches?: {
				title?: boolean;
				content?: string[];
				tags?: string[];
			};
		}>;
		query: string;
		onSelect: (page: MarkdownPage) => void;
	}

	let { results, query, onSelect }: Props = $props();

	function highlightMatch(text: string, queryStr: string): string {
		if (!queryStr) return text;
		const regex = new RegExp(`(${queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>');
	}

	function truncateWithPath(path: string, maxLength: number = 40): string {
		if (path.length <= maxLength) return path;
		const parts = path.split('/');
		if (parts.length <= 2) return path;

		const first = parts[0];
		const last = parts[parts.length - 1];
		const middle = parts.slice(1, -1).map(p => p[0]).join('/');

		return `${first}/${middle}/.../${last}`;
	}

	const resultCount = $derived(() => results.length);
</script>

{#if results.length > 0}
	<div class="flex flex-col">
		<!-- Result Count -->
		<div class="px-4 py-2 border-b border-border/50 bg-muted/20 sticky top-0 z-10">
			<p class="text-xs text-muted-foreground">
				<strong class="text-foreground">{resultCount}</strong>
				{resultCount === 1 ? ' result' : ' results'}
				{#if query} for "<span class="text-primary font-medium">{query}</span>"{/if}
			</p>
		</div>

		<!-- Results List -->
		<div class="py-1">
			{#each results as result, index}
				<button
					onclick={() => onSelect(result.page)}
					class="w-full text-left px-4 py-3 hover:bg-accent/50 transition-all duration-200 border-b border-border/30 last:border-b-0 focus-visible:bg-accent/50 focus-visible:outline-none"
					style:animation-delay={`${index * 50}ms`}
				>
					<!-- Icon and Title -->
					<div class="flex items-start gap-3 mb-1">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 mt-0.5">
							{#if result.page.path?.includes('/')}
								<Folder class="h-4 w-4 text-blue-500" />
							{:else}
								<FileText class="h-4 w-4 text-muted-foreground" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<!-- Title with Highlight -->
							<p class="text-sm font-medium truncate">
								{#if result.matches?.title}
									{@html highlightMatch(result.page.title, query)}
								{:else}
									{result.page.title}
								{/if}
							</p>

							<!-- Path (truncated) -->
							{#if result.page.path}
								<p class="text-xs text-muted-foreground font-mono truncate mt-0.5">
									{truncateWithPath(result.page.path)}
								</p>
							{/if}

							<!-- Matching Content Snippets -->
							{#if result.matches?.content && result.matches.content.length > 0}
								<p class="text-xs text-muted-foreground mt-1.5 line-clamp-2">
									...{@html highlightMatch(result.matches.content[0], query)}...
								</p>
							{/if}

							<!-- Matching Tags -->
							{#if result.matches?.tags && result.matches.tags.length > 0}
								<div class="flex flex-wrap gap-1 mt-2">
									{#each result.matches.tags as tag}
										<Badge variant="secondary" class="text-xs bg-primary/10 text-primary/80">
											{@html highlightMatch(tag, query)}
										</Badge>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
{:else}
	<!-- No Results -->
	<div class="flex flex-col items-center justify-center py-8 px-4 text-center">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
			<FileText class="h-6 w-6 text-muted-foreground" />
		</div>
		<p class="text-sm font-medium mb-1">No results found</p>
		<p class="text-xs text-muted-foreground">
			{#if query}
				No pages match "<span class="text-primary">{query}</span>"
			{:else}
				Try a different search term
			{/if}
		</p>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

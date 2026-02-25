<script lang="ts">
	import type { MarkdownPage } from "../models";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Calendar, FileText, ArrowRight, Clock } from "lucide-svelte";

	interface Props {
		page: MarkdownPage;
		onNavigate?: () => void;
		showPreview?: boolean;
	}

	let { page, onNavigate, showPreview = true }: Props = $props();

	const formattedDate = $derived(new Date(page.updatedAt * 1000).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	}));

	const wordCount = $derived((page.content || '').split(/\s+/).filter(x => x).length);

	const previewText = $derived((() => {
		const text = (page.content || '').replace(/[#*`_\[\]]/g, '').trim();
		return text.length > 120 ? text.substring(0, 120) + '...' : text;
	})());

	const tags = $derived(
		page.tags
			? (() => {
					try {
						return JSON.parse(page.tags);
					} catch {
						return [];
					}
				})()
			: []
	);
</script>

	<!-- Card with hover lift effect -->
	<article
		class="relative flex flex-col p-5 transition-all duration-300 border shadow-sm cursor-pointer group rounded-xl border-border/50 bg-card hover:shadow-md hover:-translate-y-1"
		onclick={onNavigate}
	>
	<!-- Card Header -->
	<div class="flex items-start justify-between gap-4 mb-4">
		<div class="flex items-center flex-1 min-w-0 gap-3">
			<div class="flex items-center justify-center w-10 h-10 rounded-lg shadow-sm shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 ring-2 ring-white/20">
				<FileText class="w-5 h-5 text-white" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="text-base font-semibold leading-tight truncate transition-colors group-hover:text-primary">
					{page.title}
				</h3>
				{#if page.path}
					<p class="font-mono text-xs truncate text-muted-foreground">{page.path}</p>
				{/if}
			</div>
		</div>
		<div class="transition-opacity duration-200 opacity-0 group-hover:opacity-100 shrink-0">
			<Button size="sm" variant="ghost" class="w-8 h-8 p-0 rounded-lg">
				<ArrowRight class="w-4 h-4" />
			</Button>
		</div>
	</div>

	<!-- Preview Content -->
	{#if showPreview && page.content}
		<p class="mb-4 text-sm text-muted-foreground line-clamp-3">
			{previewText}
		</p>
	{/if}

	<!-- Tags -->
	{#if tags.length > 0}
		<div class="flex flex-wrap gap-2 mb-4">
			{#each tags.slice(0, 3) as tag}
				<Badge variant="secondary" class="text-xs px-2.5 py-1 bg-primary/10 text-primary/80 ring-1 ring-primary/20">
					{tag}
				</Badge>
			{/each}
			{#if tags.length > 3}
				<Badge variant="outline" class="text-xs">+{tags.length - 3}</Badge>
			{/if}
		</div>
	{/if}

	<!-- Footer Metadata -->
	<div class="flex items-center gap-4 pt-4 mt-auto text-xs border-t text-muted-foreground border-border/30">
		<div class="flex items-center gap-1">
			<Calendar class="w-3 h-3" />
			<span>{formattedDate}</span>
		</div>
		<div class="flex items-center gap-1">
			<FileText class="w-3 h-3" />
			<span>{wordCount} words</span>
		</div>
		{#if page.version}
			<div class="flex items-center gap-1">
				<Clock class="w-3 h-3" />
				<span>v{page.version}</span>
			</div>
		{/if}
	</div>
</article>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

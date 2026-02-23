<script lang="ts">
	import type { MarkdownPage } from "../models";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Edit, Trash2, Share2, Calendar, Tag, FileText, Clock } from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import Breadcrumb from "./Breadcrumb.svelte";

	interface Props {
		page: MarkdownPage;
		onEdit: () => void;
		onDelete: () => void;
		onNavigate?: (path: string) => void;
	}

	let { page, onEdit, onDelete, onNavigate }: Props = $props();

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

	const path = $derived(page.path || `/${page.slug}`);

	const formattedDate = $derived(new Date(page.updatedAt * 1000).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric"
	}));

	const wordCount = $derived((page.content || '').split(/\s+/).filter(x => x).length);

	function handleNavigate(newPath: string) {
		if (onNavigate) onNavigate(newPath);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Breadcrumb -->
	<div class="px-6 py-3 border-b border-border/50 bg-gradient-to-b from-card to-card/50">
		<Breadcrumb {path} onNavigate={handleNavigate} />
	</div>

	<!-- Page Header -->
	<div class="px-6 py-4 border-b border-border/50 bg-gradient-to-b from-card to-card/50">
		<h1 class="text-3xl font-bold tracking-tight mb-3">{page.title}</h1>

		<!-- Tags -->
		<div class="flex flex-wrap items-center gap-2 mb-3">
			{#each tags as tag}
				<Badge variant="secondary" class="flex items-center gap-1 bg-primary/10 text-primary/80 hover:bg-primary/20 transition-colors duration-200 ring-1 ring-primary/20">
					<Tag class="h-3 w-3" />
					{tag}
				</Badge>
			{/each}
		</div>

		<!-- Metadata -->
		<div class="flex items-center gap-4 text-xs text-muted-foreground">
			<div class="flex items-center gap-1.5">
				<Calendar class="h-3.5 w-3.5" />
				<span>Updated {formattedDate}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<FileText class="h-3.5 w-3.5" />
				<span>{wordCount} words</span>
			</div>
			<div class="flex items-center gap-1.5">
				<Clock class="h-3.5 w-3.5" />
				<span>Version {page.version}</span>
			</div>
		</div>
	</div>

	<!-- Actions bar -->
	<div class="px-6 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
		<div class="text-sm text-muted-foreground">
			{page.content ? 'Page content ready' : 'No content'}
		</div>

		<div class="flex items-center gap-1">
			<Button size="sm" variant="ghost" onclick={onEdit} class="hover:bg-accent/50 transition-all duration-200">
				<Edit class="h-4 w-4" />
			</Button>
			<Button size="sm" variant="ghost" onclick={onDelete} class="hover:bg-destructive/10 text-destructive transition-all duration-200">
				<Trash2 class="h-4 w-4" />
			</Button>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<Button
						size="sm"
						variant="ghost"
						class="hover:bg-accent/50 transition-all duration-200"
					>
						<Share2 class="h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item>Copy link</DropdownMenu.Item>
					<DropdownMenu.Item>Export as Markdown</DropdownMenu.Item>
					<DropdownMenu.Item>Print</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto px-6 py-6">
		<div class="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
			{#if page.content}
				{@html page.content.replace(/\n/g, '<br>')}
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
						<FileText class="h-8 w-8 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">This page has no content yet.</p>
					<Button onclick={onEdit} variant="outline" size="sm" class="mt-4">
						Add Content
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

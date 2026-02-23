<script lang="ts">
	import type { TreeNode } from "../models";
	import { ChevronRight, Folder, FolderOpen, File, MoreVertical, Edit2, Tag, Trash2 } from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Button } from "$lib/components/ui/button";

	interface Props {
		node: TreeNode;
		level: number;
		selectedPath: string | null;
		expanded: Set<string>;
		onSelect: (path: string) => void;
		onToggleExpand: (path: string) => void;
		onRename?: (node: TreeNode) => void;
		onManageTags?: (node: TreeNode) => void;
		onDelete?: (node: TreeNode) => void;
		ariaSetsize?: number;
		ariaPosinset?: number;
	}

	let { node, level, selectedPath, expanded, onSelect, onToggleExpand, onRename, onManageTags, onDelete, ariaSetsize, ariaPosinset }: Props = $props();

	const isExpanded = $derived(expanded.has(node.path));
	const isSelected = $derived(selectedPath === node.path);
	const hasChildren = $derived(node.children && node.children.length > 0);
	const isFolder = $derived(node.type === "folder");
	const childCount = $derived(node.children?.length ?? 0);

	const selectedClasses = $derived(
		isSelected ? 'bg-accent ring-2 ring-primary/30' : ''
	);

	let showContextMenu = $state(false);

	function handleClick() {
		if (hasChildren) {
			onToggleExpand(node.path);
		}
		onSelect(node.path);
	}

	function handleChevronClick(e: MouseEvent) {
		e.stopPropagation();
		onToggleExpand(node.path);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	function handleContextMenuAction(action: () => void) {
		action();
		showContextMenu = false;
	}

	// Close context menu when clicking outside
	function handleClickOutside(e: MouseEvent) {
		if (!e.target || !(e.target as Element).closest('.context-menu-container')) {
			showContextMenu = false;
		}
	}

	// Add click outside listener when menu is open
	$effect(() => {
		if (showContextMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div
	class="group relative flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 {selectedClasses}"
	style:padding-left="{level * 16 + 12}px"
	onclick={handleClick}
	onkeydown={handleKeydown}
	role="treeitem"
	aria-selected={isSelected}
	aria-expanded={isExpanded}
	aria-level={level + 1}
	aria-setsize={ariaSetsize}
	aria-posinset={ariaPosinset}
	tabindex="0"
>
	<!-- Chevron -->
	{#if hasChildren}
		<button
			type="button"
			class="flex items-center justify-center w-5 h-5 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''} hover:bg-accent rounded"
			onclick={handleChevronClick}
			aria-label={isExpanded ? `Collapse ${node.title}` : `Expand ${node.title}`}
			aria-expanded={isExpanded}
		>
			<ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
		</button>
	{:else}
		<div class="w-5"></div>
	{/if}

	<!-- Icon -->
	{#if isFolder}
		{#if isExpanded}
			<FolderOpen class="h-4 w-4 text-blue-500 shrink-0" />
		{:else}
			<Folder class="h-4 w-4 text-blue-500 shrink-0" />
		{/if}
	{:else}
		<File class="h-4 w-4 text-muted-foreground shrink-0" />
	{/if}

	<!-- Title and Path -->
	<div class="flex flex-col flex-1 min-w-0">
		<span class="text-sm truncate">{node.title}</span>
		{#if node.path && node.path.length > 1 && node.path !== `/${node.slug}` && node.type === "folder"}
			<span class="text-xs text-muted-foreground truncate">{node.path}</span>
		{/if}
	</div>

	<!-- Child count badge -->
	{#if hasChildren}
		<span class="text-xs text-muted-foreground" aria-label={`${childCount} items`}>
			{childCount}
		</span>
	{/if}

	<!-- Context Menu Button -->
	<div class="context-menu-container relative">
		<button
			type="button"
			class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent/80"
			onclick={(e) => { e.stopPropagation(); showContextMenu = !showContextMenu; }}
			aria-label="More options"
		>
			<MoreVertical class="h-4 w-4 text-muted-foreground" />
		</button>

		{#if showContextMenu}
			<div class="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-card border border-border rounded-md shadow-lg py-1">
				{#if isFolder}
					<!-- Folder actions -->
					<button
						onclick={() => handleContextMenuAction(() => onRename?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 transition-colors"
					>
						<Edit2 class="h-4 w-4" />
						<span>Rename Folder</span>
					</button>
					<button
						onclick={() => handleContextMenuAction(() => onManageTags?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 transition-colors"
					>
						<Tag class="h-4 w-4" />
						<span>Manage Tags</span>
					</button>
					<div class="h-px bg-border my-1"></div>
					<button
						onclick={() => handleContextMenuAction(() => onDelete?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-destructive transition-colors"
					>
						<Trash2 class="h-4 w-4" />
						<span>Delete Folder</span>
					</button>
				{:else}
					<!-- Page actions -->
					<button
						onclick={() => handleContextMenuAction(() => onRename?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 transition-colors"
					>
						<Edit2 class="h-4 w-4" />
						<span>Edit Page</span>
					</button>
					<button
						onclick={() => handleContextMenuAction(() => onManageTags?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 transition-colors"
					>
						<Tag class="h-4 w-4" />
						<span>Manage Tags</span>
					</button>
					<div class="h-px bg-border my-1"></div>
					<button
						onclick={() => handleContextMenuAction(() => onDelete?.(node))}
						class="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-destructive transition-colors"
					>
						<Trash2 class="h-4 w-4" />
						<span>Delete Page</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if isExpanded && hasChildren}
	<div role="group">
		{#each node.children as child, index}
			<svelte:self
				node={child}
				level={level + 1}
				{selectedPath}
				{expanded}
				{onSelect}
				onToggleExpand={onToggleExpand}
				ariaSetsize={child.parent?.children?.length ?? node.children.length}
				ariaPosinset={index + 1}
			/>
		{/each}
	</div>
{/if}

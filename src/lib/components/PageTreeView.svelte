<script lang="ts">
	import type { TreeNode } from "../models";
	import { Button } from "$lib/components/ui/button";
	import { Plus, ChevronDown, ChevronRight } from "lucide-svelte";
	import TreeNodeComponent from "./TreeNode.svelte";

	interface Props {
		tree: TreeNode[];
		selectedPath: string | null;
		searchQuery?: string;
		onSelect: (path: string) => void;
		onNewPage: () => void;
		onNewFolder?: () => void;
		onRenameNode?: (node: TreeNode) => void;
		onManageNodeTags?: (node: TreeNode) => void;
		onDeleteNode?: (node: TreeNode) => void;
	}

	let { tree, selectedPath, searchQuery = "", onSelect, onNewPage, onNewFolder, onRenameNode, onManageNodeTags, onDeleteNode }: Props = $props();

	let expanded = $state<Set<string>>(new Set());
	let lastExpandedPath = $state<string | null>(null);

	function expandToPath(path: string) {
		const pathParts = path.split("/").filter(Boolean);
		for (let i = 1; i <= pathParts.length; i++) {
			const partialPath = "/" + pathParts.slice(0, i).join("/");
			expanded.add(partialPath);
		}
		expanded = new Set(expanded);
		lastExpandedPath = path;
	}

	$effect(() => {
		if (selectedPath && selectedPath !== lastExpandedPath) {
			expandToPath(selectedPath);
		}
	});

	function toggleExpand(path: string) {
		if (expanded.has(path)) {
			expanded.delete(path);
		} else {
			expanded.add(path);
		}
		expanded = new Set(expanded);
	}

	function expandAll() {
		const addAllPaths = (nodes: TreeNode[]) => {
			for (const node of nodes) {
				if (node.children && node.children.length > 0) {
					expanded.add(node.path);
					addAllPaths(node.children);
				}
			}
		};
		addAllPaths(tree);
		expanded = new Set(expanded);
	}

	function collapseAll() {
		expanded = new Set();
	}
</script>

<div class="flex flex-col h-full">
	<!-- Action buttons -->
	<div class="p-2 sm:p-3 border-b border-border/50 flex gap-1.5 sm:gap-2">
		<Button onclick={onNewPage} size="sm" variant="default" class="flex-1 text-xs sm:text-sm">
			<Plus class="h-3 w-3 sm:mr-1" />
			<span class="hidden sm:inline">New Page</span>
			<span class="sm:hidden">Page</span>
		</Button>
		{#if onNewFolder}
			<Button onclick={onNewFolder} size="sm" variant="outline" class="flex-1 text-xs sm:text-sm">
				<Plus class="h-3 w-3 sm:mr-1" />
				<span class="hidden sm:inline">New Folder</span>
				<span class="sm:hidden">Folder</span>
			</Button>
		{/if}
	</div>

	<!-- Expand/Collapse controls -->
	<div class="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border/50 flex items-center justify-between">
		<div class="flex gap-1">
			<button
				onclick={expandAll}
				class="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs rounded-md hover:bg-accent/50 flex items-center gap-1 transition-colors"
				aria-label="Expand all folders"
			>
				<ChevronDown class="h-3 w-3" />
				<span class="hidden sm:inline">Expand</span>
			</button>
			<button
				onclick={collapseAll}
				class="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs rounded-md hover:bg-accent/50 flex items-center gap-1 transition-colors"
				aria-label="Collapse all folders"
			>
				<ChevronRight class="h-3 w-3" />
				<span class="hidden sm:inline">Collapse</span>
			</button>
		</div>
		<span class="text-[10px] sm:text-xs text-muted-foreground" aria-live="polite">
			{tree.length} {tree.length === 1 ? 'item' : 'items'}
		</span>
	</div>

	<!-- Tree content -->
	<div
		class="flex-1 overflow-y-auto"
		role="tree"
		aria-label="Markdown documents"
	>
		{#if tree.length === 0}
			<div class="p-4 sm:p-6 text-center">
				<div class="flex flex-col items-center gap-3">
					<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted/50 flex items-center justify-center">
						<Plus class="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
					</div>
					<p class="text-xs sm:text-sm text-muted-foreground">No pages match the current filters</p>
				</div>
			</div>
		{:else}
			<div class="p-1.5 sm:p-2">
				{#each tree as node, index}
					<TreeNodeComponent
						node={node}
						level={0}
						{selectedPath}
						{expanded}
						{onSelect}
						onToggleExpand={toggleExpand}
						onRename={onRenameNode}
						onManageTags={onManageNodeTags}
						onDelete={onDeleteNode}
						aria-setsize={tree.length}
						aria-posinset={index + 1}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.scrollbar-thin) {
		scrollbar-width: thin;
	}
	:global(.scrollbar-track-transparent) {
		scrollbar-track-color: transparent;
	}
	:global(.scrollbar-thumb-border\/30) {
		scrollbar-thumb-color: hsl(var(--border) / 0.3);
		border-radius: 9999px;
	}
	:global(.hover\:scrollbar-thumb-border\/50:hover) {
		scrollbar-thumb-color: hsl(var(--border) / 0.5);
	}
</style>

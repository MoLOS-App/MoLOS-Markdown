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
	<div class="p-3 border-b border-border/50 flex gap-2">
		<Button onclick={onNewPage} size="sm" variant="default" class="flex-1">
			<Plus class="h-3 w-3 mr-1" />
			New Page
		</Button>
		{#if onNewFolder}
			<Button onclick={onNewFolder} size="sm" variant="outline" class="flex-1">
				<Plus class="h-3 w-3 mr-1" />
				New Folder
			</Button>
		{/if}
	</div>

	<!-- Expand/Collapse controls -->
	<div class="px-3 py-2 border-b border-border/50 flex items-center justify-between">
		<div class="flex gap-1">
			<button
				onclick={expandAll}
				class="px-2 py-1 text-xs rounded-md hover:bg-accent/50 flex items-center gap-1 transition-colors"
				aria-label="Expand all folders"
			>
				<ChevronDown class="h-3 w-3" />
				Expand
			</button>
			<button
				onclick={collapseAll}
				class="px-2 py-1 text-xs rounded-md hover:bg-accent/50 flex items-center gap-1 transition-colors"
				aria-label="Collapse all folders"
			>
				<ChevronRight class="h-3 w-3" />
				Collapse
			</button>
		</div>
		<span class="text-xs text-muted-foreground" aria-live="polite">
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
			<div class="p-6 text-center">
				<div class="flex flex-col items-center gap-3">
					<div class="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
						<Plus class="h-5 w-5 text-muted-foreground" />
					</div>
					<p class="text-sm text-muted-foreground">No pages match the current filters</p>
				</div>
			</div>
		{:else}
			<div class="p-2">
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

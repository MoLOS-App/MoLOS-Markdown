<script lang="ts">
	import type { PageData } from "./$types";
	import type { MarkdownPage, TreeNode } from "../../models";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Input } from "$lib/components/ui/input";
	import {
		BookOpen, FileText, Search, Edit, Trash2, Save, X, Calendar, Tag, FileText as FileTextIcon, Clock
	} from "lucide-svelte";
	import PageEditor from "../../lib/components/PageEditor.svelte";
	import PageCreateDialog from "../../lib/components/PageCreateDialog.svelte";
	import PageTreeView from "../../lib/components/PageTreeView.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select";
	import { marked } from "marked";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let tree = $state<TreeNode[]>(data.tree ?? []);
	let pages = $state<Map<string, MarkdownPage>>(new Map((data.pages ?? []).map(p => [p.id, p])));
	let templates = $state(data.templates ?? []);
	let selectedPath = $state<string | null>(null);
	let selectedPageId = $state<string | null>(null);
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let isEditing = $state(false);
	let editContent = $state("");
	let searchQuery = $state("");
	let showDeleteDialog = $state(false);
	let pageToDelete = $state<MarkdownPage | null>(null);
	let isSaving = $state(false);
	let tagFilter = $state<string>("all");

	// Context menu state
	let contextMenuNode = $state<TreeNode | null>(null);
	let showRenameDialog = $state(false);
	let showManageTagsDialog = $state(false);
	let renameValue = $state("");
	let tagsValue = $state<string[]>([]);

	// Get all existing paths for autocomplete
	const existingPaths = $derived(Array.from(pages.values()).map(p => p.path || `/${p.slug}`));

	// Get all unique tags from pages
	const allTags = $derived((() => {
		const tagSet = new Set<string>();
		for (const page of pages.values()) {
			if (page.tags) {
				try {
					const tags = JSON.parse(page.tags);
					tags.forEach((tag: string) => tagSet.add(tag));
				} catch {
					// Invalid JSON, skip
				}
			}
		}
		return Array.from(tagSet).sort();
	})());

	// Filtered tree based on search and tag
	const filteredTree = $derived((() => {
		let result = [...(tree || [])];

		// Filter by tag
		if (tagFilter !== "all") {
			const pageIds = Array.from(pages.values())
				.filter(p => {
					if (!p.tags) return false;
					try {
						const tags = JSON.parse(p.tags);
						return tags.includes(tagFilter);
					} catch {
						return false;
					}
				})
				.map(p => p.path || `/${p.slug}`);
			result = result.filter(node => pageIds.includes(node.path));
		}

		// Filter by search query
		if (searchQuery) {
			const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
				const results: TreeNode[] = [];
				for (const node of nodes) {
					const matchesSearch = node.title.toLowerCase().includes(searchQuery.toLowerCase());
					const filteredChildren = node.children ? filterNodes(node.children) : [];

					if (matchesSearch || filteredChildren.length > 0) {
						results.push({
							...node,
							children: node.children && filteredChildren.length > 0 ? filteredChildren : undefined
						});
					}
				}
				return results;
			};
			result = filterNodes(result);
		}

		return result;
	})());

	// Find page by path
	const selectedPage = $derived((() => {
		if (!selectedPath) return null;
		return Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === selectedPath) || null;
	})());

	// Stats
	const filteredPagesCount = $derived((() => {
		let count = 0;
		for (const node of filteredTree) {
			count += 1;
			if (node.children) count += node.children.length;
		}
		return count;
	})());

	async function handleSelectPath(path: string) {
		selectedPath = path;
		isEditing = false;
		const page = Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === path);
		selectedPageId = page?.id || null;

		// Fetch page details if not in cache
		if (!page) {
			const response = await fetch(`/api/MoLOS-Markdown/markdown?path=${encodeURIComponent(path)}`);
			if (response.ok) {
				const fetchedPage: MarkdownPage = await response.json();
				pages.set(fetchedPage.id, fetchedPage);
				selectedPageId = fetchedPage.id;
			}
		}
	}

	async function handleCreatePage(pageData: { title: string; path: string; tags?: string[] }) {
		const response = await fetch("/api/MoLOS-Markdown/markdown", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...pageData, content: "" })
		});

		if (response.ok) {
			const newPage = await response.json();
			pages.set(newPage.id, newPage);
			await refreshTree();
			showCreateDialog = false;
			// Select the new page and enter edit mode
			selectedPath = newPage.path || `/${newPage.slug}`;
			selectedPageId = newPage.id;
			isEditing = true;
			editContent = "";
		}
	}

	async function handleSaveContent() {
		if (!selectedPageId || isSaving) return;

		isSaving = true;
		const response = await fetch(`/api/MoLOS-Markdown/markdown/${selectedPageId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: editContent })
		});

		if (response.ok) {
			const updatedPage = await response.json();
			// Create a new Map with the updated page to trigger reactivity
			const newPages = new Map(pages);
			newPages.set(updatedPage.id, updatedPage);
			pages = newPages;
			isEditing = false;
			editContent = ""; // Clear edit content after saving
		} else {
			// Show error or keep editing on failure
			alert("Failed to save content");
		}
		isSaving = false;
	}

	function startEditing() {
		if (selectedPage) {
			editContent = selectedPage.content || "";
			isEditing = true;
		}
	}

	function cancelEditing() {
		isEditing = false;
		editContent = "";
	}

	async function handleUpdatePage(data: { title?: string; content?: string; tags?: string[]; path?: string }) {
		if (!selectedPageId) return;

		const response = await fetch(`/api/MoLOS-Markdown/markdown/${selectedPageId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		});

		if (response.ok) {
			const updatedPage = await response.json();
			// Update the page in the Map and trigger reactivity
			const newPages = new Map(pages);
			newPages.set(updatedPage.id, updatedPage);
			pages = newPages;
			await refreshTree();
			showEditDialog = false;
		} else {
			alert("Failed to update page");
		}
	}

	async function handleDeletePage() {
		if (!pageToDelete) return;

		try {
			const response = await fetch(`/api/MoLOS-Markdown/markdown/${pageToDelete.id}`, {
				method: "DELETE"
			});

			if (response.ok) {
				// Remove from pages Map and trigger reactivity
				const newPages = new Map(pages);
				newPages.delete(pageToDelete.id);
				pages = newPages;

				selectedPath = null;
				selectedPageId = null;
				isEditing = false;
				showDeleteDialog = false;
				pageToDelete = null;
				await refreshTree();
			} else {
				const error = await response.json();
				alert(`Failed to delete page: ${error?.message || "Unknown error"}`);
			}
		} catch (e) {
			console.error("Delete error:", e);
			alert("Failed to delete page. Please try again.");
		}
	}

	async function refreshTree() {
		const response = await fetch("/api/MoLOS-Markdown/markdown?tree=true");
		if (response.ok) {
			tree = await response.json();
		}
	}

	function handleNavigate(path: string) {
		handleSelectPath(path);
	}

	function promptDelete(page: MarkdownPage) {
		pageToDelete = page;
		showDeleteDialog = true;
	}

	// Context menu handlers
	function handleRenameNode(node: TreeNode) {
		contextMenuNode = node;
		renameValue = node.title;
		showRenameDialog = true;
	}

	function handleManageNodeTags(node: TreeNode) {
		contextMenuNode = node;
		// For folders, we'll manage tags of all pages in the folder
		if (node.type === "folder") {
			// Collect all tags from pages in this folder
			const folderTags = new Set<string>();
			for (const page of pages.values()) {
				const pagePath = page.path || `/${page.slug}`;
				if (pagePath.startsWith(node.path)) {
					if (page.tags) {
						try {
							const tags = JSON.parse(page.tags);
							tags.forEach((tag: string) => folderTags.add(tag));
						} catch {
							// Skip invalid tags
						}
					}
				}
			}
			tagsValue = Array.from(folderTags);
		} else {
			// For pages, get the page's tags
			const page = Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === node.path);
			if (page?.tags) {
				try {
					tagsValue = JSON.parse(page.tags);
				} catch {
					tagsValue = [];
				}
			} else {
				tagsValue = [];
			}
		}
		showManageTagsDialog = true;
	}

	async function handleDeleteNode(node: TreeNode) {
		if (node.type === "folder") {
			if (!confirm(`Delete folder "${node.title}" and all its contents? This action cannot be undone.`)) {
				return;
			}
			// Delete all pages in this folder
			for (const page of pages.values()) {
				const pagePath = page.path || `/${page.slug}`;
				if (pagePath.startsWith(node.path)) {
					try {
						await fetch(`/api/MoLOS-Markdown/markdown/${page.id}`, {
							method: "DELETE"
						});
						pages.delete(page.id);
					} catch (e) {
						console.error(`Failed to delete page ${page.id}:`, e);
					}
				}
			}
			await refreshTree();
		} else {
			// Delete single page
			const page = Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === node.path);
			if (page) {
				promptDelete(page);
			}
		}
	}

	async function handleSaveRename() {
		if (!contextMenuNode || !renameValue.trim()) return;

		if (contextMenuNode.type === "folder") {
			// For folders, we need to update all pages in the folder
			const oldPath = contextMenuNode.path;
			const pathParts = oldPath.split("/").filter(Boolean);
			// Replace the folder name (last part) with the new name
			pathParts[pathParts.length - 1] = renameValue.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
			const newPath = "/" + pathParts.join("/");

			// Update all pages in the folder
			for (const [id, page] of pages) {
				const pagePath = page.path || `/${page.slug}`;
				if (pagePath.startsWith(oldPath)) {
					const relativePath = pagePath.slice(oldPath.length);
					const newPagePath = newPath + relativePath;

					const response = await fetch(`/api/MoLOS-Markdown/markdown/${id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							path: newPagePath
						})
					});

					if (response.ok) {
						const updatedPage = await response.json();
						pages.set(id, updatedPage);
					}
				}
			}
			await refreshTree();
		} else {
			// For pages, use the existing update handler
			const page = Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === contextMenuNode?.path);
			if (page) {
				selectedPageId = page.id;
				await handleUpdatePage({ title: renameValue.trim() });
			}
		}

		showRenameDialog = false;
		contextMenuNode = null;
		renameValue = "";
	}

	async function handleSaveTags() {
		if (!contextMenuNode) return;

		if (contextMenuNode.type === "folder") {
			// Update tags for all pages in the folder
			for (const [id, page] of pages) {
				const pagePath = page.path || `/${page.slug}`;
				if (pagePath.startsWith(contextMenuNode.path)) {
					const response = await fetch(`/api/MoLOS-Markdown/markdown/${id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ tags: tagsValue })
					});

					if (response.ok) {
						const updatedPage = await response.json();
						pages.set(id, updatedPage);
					}
				}
			}
		} else {
			// Update tags for single page
			const page = Array.from(pages.values()).find(p => (p.path || `/${p.slug}`) === contextMenuNode?.path);
			if (page) {
				await handleUpdatePage({ tags: tagsValue });
			}
		}

		showManageTagsDialog = false;
		contextMenuNode = null;
		tagsValue = [];
	}

	// Helper variables and functions for the manage tags dialog
	let newTagInput = $state("");

	function addTagFromDialog() {
		if (newTagInput.trim() && !tagsValue.includes(newTagInput.trim())) {
			tagsValue = [...tagsValue, newTagInput.trim()];
			newTagInput = "";
		}
	}

	function removeTagFromDialog(tagToRemove: string) {
		tagsValue = tagsValue.filter(t => t !== tagToRemove);
	}

	const wordCount = $derived(editContent.split(/\s+/).filter(x => x).length);
	const renderedPageContent = $derived(selectedPage?.content ? marked(selectedPage.content) : "");
</script>

<div class="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
	<!-- Top Filter Bar -->
	<header class="border-b bg-card/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
		<div class="flex items-center justify-between gap-6">
			<!-- Left: Title & Search -->
			<div class="flex items-center gap-6 flex-1">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-emerald-500/10 rounded-lg">
						<BookOpen class="h-5 w-5 text-emerald-500" />
					</div>
					<div>
						<h1 class="text-xl font-bold tracking-tight">Markdown Documents</h1>
						<p class="text-xs text-muted-foreground">Knowledge base & documentation</p>
					</div>
				</div>

				<div class="h-8 w-px bg-border"></div>

				<div class="relative flex-1 max-w-md">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search pages..."
						class="pl-10 h-10 bg-muted/50 border-muted focus-visible:bg-background transition-colors"
					/>
				</div>
			</div>

			<!-- Right: Filters & Stats -->
			<div class="flex items-center gap-4">
				<!-- Tag Filter -->
				{#if allTags.length > 0}
					<Select bind:value={tagFilter}>
						<SelectTrigger class="w-[160px] h-10">
							<Tag class="h-4 w-4 mr-2 text-muted-foreground" />
							{tagFilter === "all" ? "All Tags" : tagFilter}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Tags</SelectItem>
							{#each allTags as tag}
								<SelectItem value={tag}>{tag}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar -->
		<aside class="flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/50 w-80" aria-label="Markdown documents navigation">
			<PageTreeView
				tree={filteredTree}
				{selectedPath}
				searchQuery=""
				onSelect={handleSelectPath}
				onNewPage={() => showCreateDialog = true}
				onRenameNode={handleRenameNode}
				onManageNodeTags={handleManageNodeTags}
				onDeleteNode={handleDeleteNode}
			/>
		</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-hidden bg-muted/30/50 backdrop-blur-sm" aria-live="polite">
		{#if selectedPage}
			<!-- View Mode -->
			{#if !isEditing}
				<div class="flex flex-col h-full">
					<!-- Actions bar -->
					<div class="px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between shrink-0">
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
								<FileTextIcon class="h-3.5 w-3.5 text-emerald-500" />
								<span class="text-xs font-medium">{selectedPage.content ? 'Ready' : 'No content'}</span>
							</div>
							{#if selectedPage.content}
								<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
									<span class="text-xs font-medium">{selectedPage.content.split(/\s+/).filter(x => x).length} words</span>
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<Button size="sm" variant="ghost" onclick={startEditing} class="hover:bg-accent/50">
								<Edit class="h-4 w-4 mr-1" />
								Edit
							</Button>
							<Button size="sm" variant="ghost" onclick={() => showEditDialog = true} class="hover:bg-accent/50">
								<Edit class="h-4 w-4" />
							</Button>
							<Button size="sm" variant="ghost" onclick={() => promptDelete(selectedPage)} class="hover:bg-destructive/10 text-destructive">
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>

					<!-- Page Content -->
					<div class="flex-1 overflow-y-auto px-6 py-6">
						<h1 class="text-2xl font-bold tracking-tight mb-4">{selectedPage.title}</h1>

						<!-- Tags and metadata -->
						<div class="flex flex-wrap items-center gap-2 mb-6">
							{#each (selectedPage.tags ? JSON.parse(selectedPage.tags) : []) as tag}
								<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium">
									{tag}
								</div>
							{/each}
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
								<Calendar class="h-3.5 w-3.5" />
								<span>{new Date(selectedPage.updatedAt * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
							</div>
						</div>

						<!-- Content -->
						<div class="markdown-content">
							{#if selectedPage.content}
								{@html renderedPageContent}
							{:else}
								<div class="flex flex-col items-center justify-center py-16 text-center">
									<div class="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
										<FileText class="h-8 w-8 text-muted-foreground/50" />
									</div>
									<h3 class="text-lg font-semibold mb-2">No content yet</h3>
									<p class="text-muted-foreground text-sm mb-4">Start writing to create your markdown document</p>
									<Button onclick={startEditing} variant="outline" size="sm">
										<Edit class="h-4 w-4 mr-1" />
										Add Content
									</Button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<!-- Edit Mode -->
				<div class="flex flex-col h-full">
					<!-- Editor header -->
					<div class="px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between shrink-0">
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
								<Edit class="h-3.5 w-3.5 text-blue-500" />
								<span class="text-xs font-medium">Editing</span>
							</div>
							<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
								<span class="text-xs font-medium">{wordCount} words</span>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<Button size="sm" variant="outline" onclick={cancelEditing} disabled={isSaving}>
								<X class="h-4 w-4 mr-1" />
								Cancel
							</Button>
							<Button size="sm" onclick={handleSaveContent} disabled={isSaving}>
								<Save class="h-4 w-4 mr-1" />
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>

					<!-- Editor toolbar -->
					<div class="px-6 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-1 shrink-0">
						<button
							onclick={() => { editContent += '**bold**'; }}
							class="p-2 rounded-md hover:bg-accent/50 text-sm font-semibold"
							title="Bold"
						>
							B
						</button>
						<button
							onclick={() => { editContent += '*italic*'; }}
							class="p-2 rounded-md hover:bg-accent/50 text-sm italic"
							title="Italic"
						>
							I
						</button>
						<button
							onclick={() => { editContent += '`code`'; }}
							class="p-2 rounded-md hover:bg-accent/50 text-sm font-mono"
							title="Code"
						>
							&lt;&gt;
						</button>
						<div class="h-6 w-px bg-border mx-1"></div>
						<button
							onclick={() => { editContent += '\n## '; }}
							class="p-2 rounded-md hover:bg-accent/50 text-sm font-semibold"
							title="Heading"
						>
							H
						</button>
						<button
							onclick={() => { editContent += '\n- '; }}
							class="p-2 rounded-md hover:bg-accent/50 text-sm"
							title="List"
						>
							•
						</button>
					</div>

					<!-- Editor -->
					<div class="flex-1 p-6 overflow-hidden">
						<Textarea
							bind:value={editContent}
							placeholder="Write your content in Markdown..."
							class="w-full h-full font-mono text-sm resize-none"
						/>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Empty State -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center max-w-md">
					<div class="w-20 h-20 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
						<BookOpen class="h-10 w-10 text-emerald-500/50" />
					</div>
					<h3 class="text-xl font-bold mb-2 tracking-tight">Markdown Documents</h3>
					<p class="text-muted-foreground text-sm mb-6">
						Create documentation, notes, and knowledge base pages
					</p>
					<Button onclick={() => showCreateDialog = true}>
						Create Your First Page
					</Button>
				</div>
			</div>
		{/if}
		</main>
	</div>
</div>

<!-- Create Dialog -->
{#if showCreateDialog}
	<PageCreateDialog
		{existingPaths}
		onCreate={handleCreatePage}
		onClose={() => showCreateDialog = false}
	/>
{/if}

<!-- Edit Dialog (for metadata editing) -->
{#if showEditDialog && selectedPage}
	<PageEditor
		page={selectedPage}
		{existingPaths}
		onUpdate={handleUpdatePage}
		onClose={() => showEditDialog = false}
	/>
{/if}

<!-- Delete Confirmation Dialog -->
{#if showDeleteDialog && pageToDelete}
	<Dialog.Root open={showDeleteDialog} onOpenChange={(open) => {
		if (!open) showDeleteDialog = false;
	}}>
		<Dialog.Content class="shadow-xl">
			<Dialog.Header>
				<Dialog.Title>Delete Page</Dialog.Title>
				<Dialog.Description class="space-y-2">
					<p>Are you sure you want to delete <strong>"{pageToDelete.title}"</strong>? This action cannot be undone.</p>
					{#if tree.some(n => n.path.startsWith(pageToDelete.path || `/${pageToDelete.slug}`))}
						<div class="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
							<span class="text-destructive">!</span>
							<p class="text-destructive font-medium text-sm">This will also delete all child pages.</p>
						</div>
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => showDeleteDialog = false} class="transition-all duration-200">Cancel</Button>
				<Button variant="destructive" onclick={handleDeletePage} class="shadow-sm hover:shadow-md transition-all duration-200">Delete</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Rename Dialog -->
{#if showRenameDialog && contextMenuNode}
	<Dialog.Root open={showRenameDialog} onOpenChange={(open) => {
		if (!open) showRenameDialog = false;
	}}>
		<Dialog.Content class="shadow-xl max-w-md">
			<Dialog.Header>
				<Dialog.Title>
					{contextMenuNode.type === "folder" ? "Rename Folder" : "Rename Page"}
				</Dialog.Title>
				<Dialog.Description>
					Enter a new name for <strong>"{contextMenuNode.title}"</strong>
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<Input
					bind:value={renameValue}
					placeholder="New name..."
					onkeypress={(e) => e.key === "Enter" && handleSaveRename()}
					autofocus
				/>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => showRenameDialog = false}>Cancel</Button>
				<Button onclick={handleSaveRename} disabled={!renameValue.trim()}>Rename</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Manage Tags Dialog -->
{#if showManageTagsDialog && contextMenuNode}
	<Dialog.Root open={showManageTagsDialog} onOpenChange={(open) => {
		if (!open) showManageTagsDialog = false;
	}}>
		<Dialog.Content class="shadow-xl max-w-md">
			<Dialog.Header>
				<Dialog.Title>
					{contextMenuNode.type === "folder" ? "Manage Folder Tags" : "Manage Page Tags"}
				</Dialog.Title>
				<Dialog.Description>
					{contextMenuNode.type === "folder"
						? `Manage tags for all pages in "${contextMenuNode.title}"`
						: `Manage tags for "${contextMenuNode.title}"`
					}
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4 space-y-4">
				<div class="flex gap-2">
					<Input
						bind:value={newTagInput}
						placeholder="Add tag..."
						onkeypress={(e) => e.key === "Enter" && (e.preventDefault(), addTagFromDialog())}
					/>
					<Button size="sm" variant="outline" onclick={addTagFromDialog}>
						Add
					</Button>
				</div>
				{#if tagsValue.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each tagsValue as tag}
							<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium">
								{tag}
								<button
									onclick={() => removeTagFromDialog(tag)}
									class="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No tags yet. Add tags above.</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => showManageTagsDialog = false}>Cancel</Button>
				<Button onclick={handleSaveTags}>Save Tags</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

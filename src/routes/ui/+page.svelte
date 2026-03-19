<script lang="ts">
	import type { PageData } from "./$types";
	import type { MarkdownPage, TreeNode } from "../../models";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Input } from "$lib/components/ui/input";
	import {
		BookOpen, FileText, Search, Wrench, Trash2, Save, X, Calendar, Tag, FileText as FileTextIcon, Clock, Menu, X as CloseIcon,

		SquarePen

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

	// Mobile sidebar state
	let sidebarOpen = $state(false);

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

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}</script>

<div class="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
	<!-- Top Filter Bar -->
	<header class="border-b bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
			<!-- Left: Title, Menu, & Search -->
			<div class="flex items-center flex-wrap md:flex-nowrap gap-3 sm:gap-6 w-full sm:flex-1">
				<div class="flex  items-center gap-3 flex-shrink-0">
					<Button
						variant="ghost"
						size="icon"
						class="md:hidden"
						onclick={toggleSidebar}
						aria-label="Toggle sidebar"
					>
						<Menu class="h-5 w-5" />
					</Button>
					<div class="p-2 bg-emerald-500/10 rounded-lg hidden sm:flex">
						<BookOpen class="h-5 w-5 text-emerald-500" />
					</div>
					<div class="flex-1 min-w-0">
						<h1 class="text-lg sm:text-xl font-bold tracking-tight truncate">Markdown Documents</h1>
						<p class="text-xs text-muted-foreground hidden sm:block">Knowledge base & documentation</p>
					</div>
				</div>

				<div class="h-8 w-px bg-border hidden sm:block"></div>

				<div class="relative w-full sm:flex-1 sm:max-w-md">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search pages..."
						class="pl-10 h-9 sm:h-10 bg-muted/50 border-muted focus-visible:bg-background transition-colors"
					/>
				</div>
			</div>

			<!-- Right: Filters & Stats -->
			<div class="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
				<!-- Tag Filter -->
				{#if allTags.length > 0}
					<Select bind:value={tagFilter}>
						<SelectTrigger class="w-full sm:w-[160px] h-9 sm:h-10">
							<Tag class="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
							<span class="truncate">{tagFilter === "all" ? "All Tags" : tagFilter}</span>
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

	<!-- Mobile Sidebar (Drawer) -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<!-- Overlay -->
			<div
				class="absolute inset-0 bg-black/50"
				onclick={closeSidebar}
				aria-hidden="true"
			></div>
			<!-- Sidebar -->
			<aside class="absolute inset-y-0 left-0 w-80 bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col shadow-xl">
				<div class="flex items-center justify-between p-4 border-b border-border/50">
					<h2 class="text-sm font-semibold">Documents</h2>
					<Button variant="ghost" size="icon" onclick={closeSidebar}>
						<CloseIcon class="h-4 w-4" />
					</Button>
				</div>
				<PageTreeView
					tree={filteredTree}
					{selectedPath}
					searchQuery=""
					onSelect={(path) => {
						handleSelectPath(path);
						closeSidebar();
					}}
					onNewPage={() => {
						showCreateDialog = true;
						closeSidebar();
					}}
					onRenameNode={handleRenameNode}
					onManageNodeTags={handleManageNodeTags}
					onDeleteNode={handleDeleteNode}
				/>
			</aside>
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Desktop Sidebar (Static) -->
		<aside class="hidden lg:flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/50 w-80" aria-label="Markdown documents navigation">
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
					<div class="px-3 sm:px-6 py-2 sm:py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between gap-2 shrink-0">
						<div class="flex items-center gap-2 sm:gap-3 flex-wrap">
							<div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
								<FileTextIcon class="h-3.5 w-3.5 text-emerald-500" />
								<span class="text-xs font-medium">{selectedPage.content ? 'Ready' : 'No content'}</span>
							</div>
							{#if selectedPage.content}
								<div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
									<span class="text-xs font-medium">{selectedPage.content.split(/\s+/).filter(x => x).length} words</span>
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-1 sm:gap-2">
							<Button size="sm" variant="ghost" onclick={startEditing} class="hover:bg-accent/50">
								<SquarePen class="h-4 w-4 sm:mr-1" />
								<span class="hidden sm:inline">Edit</span>
							</Button>
							<Button size="sm" variant="ghost" onclick={() => showEditDialog = true} class="hover:bg-accent/50">
								<Wrench class="h-4 w-4" />
							</Button>
							<Button size="sm" variant="ghost" onclick={() => promptDelete(selectedPage)} class="hover:bg-destructive/10 text-destructive">
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>

					<!-- Page Content -->
					<div class="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
						<h1 class="text-xl sm:text-2xl font-bold tracking-tight mb-3 sm:mb-4">{selectedPage.title}</h1>

						<!-- Tags and metadata -->
						<div class="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
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
								<div class="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
									<div class="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
										<FileText class="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
									</div>
									<h3 class="text-base sm:text-lg font-semibold mb-2">No content yet</h3>
									<p class="text-muted-foreground text-xs sm:text-sm mb-4">Start writing to create your markdown document</p>
									<Button onclick={startEditing} variant="outline" size="sm">
										<SquarePen class="h-4 w-4 mr-1" />
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
					<div class="px-3 sm:px-6 py-2 sm:py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between gap-2 shrink-0">
						<div class="flex items-center gap-2 sm:gap-3 flex-wrap">
							<div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
								<SquarePen class="h-3.5 w-3.5 text-blue-500" />
								<span class="text-xs font-medium">Editing</span>
							</div>
							<div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
								<span class="text-xs font-medium">{wordCount} words</span>
							</div>
						</div>

						<div class="flex items-center gap-1 sm:gap-2">
							<Button size="sm" variant="outline" onclick={cancelEditing} disabled={isSaving}>
								<X class="h-4 w-4 sm:mr-1" />
								<span class="hidden sm:inline">Cancel</span>
							</Button>
							<Button size="sm" onclick={handleSaveContent} disabled={isSaving}>
								<Save class="h-4 w-4 sm:mr-1" />
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>

					<!-- Editor toolbar -->
					<div class="px-3 sm:px-6 py-1.5 sm:py-2 border-b border-border/50 bg-muted/30 flex items-center gap-1 overflow-x-auto shrink-0">
						<button
							onclick={() => { editContent += '**bold**'; }}
							class="p-1.5 sm:p-2 rounded-md hover:bg-accent/50 text-sm font-semibold flex-shrink-0"
							title="Bold"
						>
							B
						</button>
						<button
							onclick={() => { editContent += '*italic*'; }}
							class="p-1.5 sm:p-2 rounded-md hover:bg-accent/50 text-sm italic flex-shrink-0"
							title="Italic"
						>
							I
						</button>
						<button
							onclick={() => { editContent += '`code`'; }}
							class="p-1.5 sm:p-2 rounded-md hover:bg-accent/50 text-sm font-mono flex-shrink-0"
							title="Code"
						>
							&lt;&gt;
						</button>
						<div class="h-5 sm:h-6 w-px bg-border mx-1 flex-shrink-0"></div>
						<button
							onclick={() => { editContent += '\n## '; }}
							class="p-1.5 sm:p-2 rounded-md hover:bg-accent/50 text-sm font-semibold flex-shrink-0"
							title="Heading"
						>
							H
						</button>
						<button
							onclick={() => { editContent += '\n- '; }}
							class="p-1.5 sm:p-2 rounded-md hover:bg-accent/50 text-sm flex-shrink-0"
							title="List"
						>
							•
						</button>
					</div>

					<!-- Editor -->
					<div class="flex-1 p-3 sm:p-6 overflow-hidden">
						<Textarea
							bind:value={editContent}
							placeholder="Write your content in Markdown..."
							class="w-full h-full font-mono text-xs sm:text-sm resize-none"
						/>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Empty State -->
			<div class="flex-1 flex items-center justify-center p-4">
				<div class="text-center max-w-md">
					<div class="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
						<BookOpen class="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500/50" />
					</div>
					<h3 class="text-lg sm:text-xl font-bold mb-2 tracking-tight">Markdown Documents</h3>
					<p class="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">
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
		<Dialog.Content class="shadow-xl max-w-[90vw] sm:max-w-md">
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
			<Dialog.Footer class="flex-col sm:flex-row gap-2">
				<Button variant="outline" onclick={() => showDeleteDialog = false} class="transition-all duration-200 w-full sm:w-auto">Cancel</Button>
				<Button variant="destructive" onclick={handleDeletePage} class="shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">Delete</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Rename Dialog -->
{#if showRenameDialog && contextMenuNode}
	<Dialog.Root open={showRenameDialog} onOpenChange={(open) => {
		if (!open) showRenameDialog = false;
	}}>
		<Dialog.Content class="shadow-xl max-w-[90vw] sm:max-w-md">
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
			<Dialog.Footer class="flex-col sm:flex-row gap-2">
				<Button variant="outline" onclick={() => showRenameDialog = false} class="w-full sm:w-auto">Cancel</Button>
				<Button onclick={handleSaveRename} disabled={!renameValue.trim()} class="w-full sm:w-auto">Rename</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Manage Tags Dialog -->
{#if showManageTagsDialog && contextMenuNode}
	<Dialog.Root open={showManageTagsDialog} onOpenChange={(open) => {
		if (!open) showManageTagsDialog = false;
	}}>
		<Dialog.Content class="shadow-xl max-w-[90vw] sm:max-w-md">
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
			<Dialog.Footer class="flex-col sm:flex-row gap-2">
				<Button variant="outline" onclick={() => showManageTagsDialog = false} class="w-full sm:w-auto">Cancel</Button>
				<Button onclick={handleSaveTags} class="w-full sm:w-auto">Save Tags</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

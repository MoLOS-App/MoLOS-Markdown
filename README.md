# MoLOS-Markdown Module

Hierarchical markdown document management module for MoLOS with tree navigation, versioning, search, templates, and quick notes support.

## Features

- **Hierarchical Navigation**: Tree-based document organization with folder support
- **Version Control**: Track and restore previous versions of documents
- **Search**: Full-text search across all documents
- **Templates**: Create reusable document templates
- **Tags**: Organize documents with flexible tagging system
- **RESTful API**: Complete CRUD operations via REST endpoints
- **AI Integration**: AI tools for document creation and management
- **Quick Notes**: Google Keep-style flat notes with checklists, colors, pinning, and archiving

## Installation

This module is included in MoLOS monorepo and is automatically loaded when module is enabled in configuration.

## Documents API Endpoints

| Route | Method | Description |
|--------|--------|-------------|
| `/api/MoLOS-Markdown/markdown` | GET | List all pages (supports query params: `?tree=true`, `?templates=true`, `?q=search`, `?path=/path`) |
| `/api/MoLOS-Markdown/markdown` | POST | Create a new page |
| `/api/MoLOS-Markdown/markdown/[id]` | GET | Get a specific page |
| `/api/MoLOS-Markdown/markdown/[id]` | PATCH | Update a page |
| `/api/MoLOS-Markdown/markdown/[id]` | DELETE | Delete a page |

### Versions

- `GET /api/MoLOS-Markdown/markdown/[id]/versions` - Get version history
- `POST /api/MoLOS-Markdown/markdown/[id]/restore` - Restore from a previous version

### Templates

- `GET /api/MoLOS-Markdown/templates` - List all templates
- `POST /api/MoLOS-Markdown/templates` - Create a new template

### Search

- `GET /api/MoLOS-Markdown/search?q=query&limit=20` - Search pages (integrated with global search)

### Import/Export

- `GET /api/MoLOS-Markdown/export` - Export all pages as JSON
- `POST /api/MoLOS-Markdown/import` - Import pages from JSON

## Quick Notes API Endpoints

| Route | Method | Description |
|--------|--------|-------------|
| `/api/MoLOS-Markdown/quick-notes` | GET | List notes (supports `?archived=true`, `?q=query`, `?pinned=true`) |
| `/api/MoLOS-Markdown/quick-notes` | POST | Create new note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | GET | Get single note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | PATCH | Update note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | DELETE | Archive note (soft delete) |
| `/api/MoLOS-Markdown/quick-notes/[id]/pin` | POST | Toggle pinned state |
| `/api/MoLOS-Markdown/quick-notes/[id]/archive` | POST | Toggle archive state |
| `/api/MoLOS-Markdown/quick-notes/[id]/checklist` | PATCH | Update checklist |
| `/api/MoLOS-Markdown/quick-notes/[id]/checklist` | POST | Toggle checklist item checkbox

### Usage

### Creating a Quick Note

```typescript
const response = await fetch('/api/MoLOS-Markdown/quick-notes', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		title: 'Shopping List',
		content: '- Milk\n- Eggs\n- Bread',
		color: 'blue',
		checklist: [
			{ id: 'item-1', text: 'Buy milk', isChecked: false },
			{ id: 'item-2', text: 'Buy eggs', isChecked: false }
		]
	})
});
```

### Pinning/Archiving Quick Notes

```typescript
await fetch(`/api/MoLOS-Markdown/quick-notes/${noteId}/pin`, {
	method: 'POST'
});

await fetch(`/api/MoLOS-Markdown/quick-notes/${noteId}/archive`, {
	method: 'POST'
});
```

## Quick Notes API Endpoints

| Route | Method | Description |
|--------|--------|-------------|
| `/api/MoLOS-Markdown/quick-notes` | GET | List notes (supports `?archived=true`, `?q=query`, `?pinned=true`) |
| `/api/MoLOS-Markdown/quick-notes` | POST | Create new note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | GET | Get single note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | PATCH | Update note |
| `/api/MoLOS-Markdown/quick-notes/[id]` | DELETE | Archive note (soft delete) |
| `/api/MoLOS-Markdown/quick-notes/[id]/pin` | POST | Toggle pinned state |
| `/api/MoLOS-Markdown/quick-notes/[id]/archive` | POST | Toggle archive state |
| `/api/MoLOS-Markdown/quick-notes/[id]/checklist` | PATCH | Update checklist |
| `/api/MoLOS-Markdown/quick-notes/[id]/checklist` | POST | Toggle checklist item checkbox

## Database Schema

### Documents Table (`MoLOS-Markdown_pages`)

| Column | Type | Description |
|--------|-------|-------------|
| id | text | Primary key |
| userId | text | User ID |
| title | text | Page title |
| slug | text | URL-friendly slug |
| content | text | Markdown content |
| isTemplate | integer | Template flag |
| parentPageId | text | Parent page ID (for hierarchy) |
| path | text | Hierarchical path (e.g., "/docs/api/reference") |
| tags | text | JSON array of tags |
| version | integer | Current version number |
| createdAt | integer | Creation timestamp |
| updatedAt | integer | Last update timestamp |

**Indexes**:
- `idx_markdown_pages_user_id` - User filtering
- `idx_markdown_pages_parent_page_id` - Tree queries
- `idx_markdown_pages_path` - Path lookups
- `idx_markdown_pages_slug` - Slug queries
- `idx_markdown_pages_updated_at` - Sorting

### Versions Table (`MoLOS-Markdown_versions`)

| Column | Type | Description |
|--------|-------|-------------|
| id | text | Primary key |
| userId | text | User ID |
| pageId | text | Page ID |
| version | integer | Version number |
| content | text | Markdown content at this version |
| changeDescription | text | Description of changes |
| createdAt | integer | Creation timestamp |

**Indexes**:
- `idx_markdown_versions_page_id` - Version queries
- `idx_markdown_versions_user_id` - User version lookups
- `idx_markdown_versions_version` - Version ordering

### Quick Notes Table (`MoLOS-Markdown_quick_notes`)

| Column | Type | Description |
|--------|-------|-------------|
| id | text | Primary key |
| userId | text | User ID |
| title | text | Note title |
| content | text | Note content (markdown supported) |
| color | text | Background color code (default, red, orange, etc.) |
| isPinned | integer | Pinned note flag |
| isArchived | integer | Archived note flag |
| labels | text | JSON array of label strings |
| checklist | text | JSON array of checklist items |
| createdAt | integer | Creation timestamp |
| updatedAt | integer | Last update timestamp |

**Indexes**:
- `idx_quick_notes_user_id` - User filtering
- `idx_quick_notes_pinned` - Pinned notes (shown first)
- `idx_quick_notes_archived` - Archive filtering
- `idx_quick_notes_updated_at` - Sorting

## Usage

### Creating a Document

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		title: 'My First Document',
		content: '# Hello World\n\nThis is my first document.',
		tags: ['getting-started', 'tutorial']
	})
});
```

### Updating a Document

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown/page-id', {
	method: 'PATCH',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		content: '# Updated Content\n\nNew version of the document.',
		changeDescription: 'Updated introduction section'
	})
});
```

### Creating a Quick Note

```typescript
const response = await fetch('/api/MoLOS-Markdown/quick-notes', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		title: 'Shopping List',
		content: '- Milk\n- Eggs\n- Bread',
		color: 'blue',
		checklist: [
			{ id: 'item-1', text: 'Buy milk', isChecked: false },
			{ id: 'item-2', text: 'Buy eggs', isChecked: false }
		]
	})
});
```

### Searching Documents/Notes

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown?q=search', {
	method: 'GET'
});
const results = await response.json();
```

### Getting Version History

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown/page-id/versions');
const versions = await response.json();
```

### Restoring a Version

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown/page-id/restore', {
	method: 'POST',
	headers: {   'Content-Type': 'application/json' },
	body: JSON.stringify({ version: 2 })
});
```

### Pinning/Archiving Quick Notes

```typescript
await fetch(`/api/MoLOS-Markdown/quick-notes/${noteId}/pin`, {
	method: 'POST'
});

await fetch(`/api/MoLOS-Markdown/quick-notes/${noteId}/archive`, {
	method: 'POST'
});
```

## Stores

This module provides two store implementations:

1. **Svelte 5 Runes Stores** (recommended for new code) - `.svelte.ts` files with `$state` and `$derived`
2. **Legacy Svelte 4 Stores** - `.ts` files with `writable` and `derived` (kept for backward compatibility)

### Svelte 5 Runes Stores (Recommended)

#### Documents Store

```typescript
import {
	pagesState,
	toggleExpanded,
	expandAll,
	collapseAll,
	selectPage,
	clearSelectedPage
} from '$lib/stores/MoLOS-Markdown/index.svelte';

// Access reactive state (no $ prefix needed)
pagesState.selectedPageId      // string | null
pagesState.selectedPage         // MarkdownPage | null
pagesState.expandedNodes        // Set<string>
pagesState.searchQuery          // string
pagesState.tagFilter            // string
pagesState.pages                // Map<string, MarkdownPage>
pagesState.tree                 // TreeNode[]
pagesState.templates            // MarkdownPage[]
pagesState.showCreateDialog     // boolean
pagesState.showEditDialog       // boolean
pagesState.isEditing            // boolean
pagesState.editContent          // string
pagesState.showDeleteDialog     // boolean
pagesState.pageToDelete         // MarkdownPage | null
pagesState.filteredPages        // MarkdownPage[] (derived)
pagesState.allTags              // string[] (derived)
pagesState.pagesArray           // MarkdownPage[] (derived)

// Actions
selectPage(page);               // Select a page
clearSelectedPage();            // Clear selection
toggleExpanded(path);           // Toggle tree node
expandAll(paths);               // Expand all nodes
collapseAll();                  // Collapse all nodes
```

#### Quick Notes Store

```typescript
import {
	quickNotesState,
	selectNote,
	clearSelectedNote,
	setNotes
} from '$lib/stores/MoLOS-Markdown/quick-notes.svelte';

// Access reactive state (no $ prefix needed)
quickNotesState.notes           // QuickNote[]
quickNotesState.selectedId      // string | null
quickNotesState.selected        // QuickNote | null
quickNotesState.createDialogOpen // boolean
quickNotesState.editDialogOpen  // boolean
quickNotesState.filter          // 'all' | 'pinned' | 'archived'
quickNotesState.search          // string
quickNotesState.filtered        // QuickNote[] (derived)
quickNotesState.pinnedCount     // number (derived)
quickNotesState.archivedCount   // number (derived)

// Actions
selectNote(note);               // Select a note
clearSelectedNote();            // Clear selection
setNotes(notes);                // Replace all notes
```

### Legacy Stores (Backward Compatibility)

For components still using Svelte 4 store patterns:

#### Documents Stores

```typescript
import {
	selectedPageId,
	selectedPage,
	expandedNodes,
	searchQuery,
	tagFilter,
	pages,
	tree,
	templates,
	filteredPages,
	allTags,
	showCreateDialog,
	showEditDialog,
	isEditing,
	editContent,
	showDeleteDialog,
	pageToDelete
} from '$lib/stores/MoLOS-Markdown';

// Use with $ prefix for reactivity
$selectedPageId
$pages
$filteredPages
```

#### Quick Notes Stores

```typescript
import {
	quickNotes,
	filteredNotes,
	selectedNoteId,
	selectedNote,
	showCreateDialog,
	showEditDialog,
	activeFilter,
	searchQuery,
	pinnedCount,
	archivedCount,
	selectNote,
	clearSelectedNote
} from '$lib/stores/MoLOS-Markdown/quick-notes';

// Use with $ prefix for reactivity
$quickNotes
$filteredNotes
```

## AI Tools

The module exposes AI tools for use with MoLOS AI system. All tools include submodule metadata for the 3-level hierarchical permission system.

### Submodules

| Submodule | Description | Tools |
|-----------|-------------|-------|
| `pages` | Markdown page/document management | `get_markdown_pages`, `get_markdown_page`, `search_markdown_pages`, `create_markdown_page`, `update_markdown_page`, `delete_markdown_page`, `get_markdown_tree`, `get_markdown_versions`, `restore_markdown_version` |
| `quick-notes` | Quick notes management | `get_quick_notes`, `get_quick_note`, `search_quick_notes`, `create_quick_note`, `update_quick_note`, `delete_quick_note`, `pin_quick_note`, `archive_quick_note`, `toggle_quick_note_checklist_item`, `update_quick_note_checklist` |

### Permission Scopes

API keys can be configured with hierarchical permissions:

- **Module level**: `MoLOS-Markdown` - Access to all tools in the module
- **Submodule level**: `MoLOS-Markdown:pages` or `MoLOS-Markdown:quick-notes` - Access to all tools in a submodule
- **Tool level**: `MoLOS-Markdown:pages:get_markdown_pages` - Access to a specific tool

### Documents AI Tools (submodule: `pages`)

- `get_markdown_pages` - Retrieve all pages
- `get_markdown_page` - Get a specific page
- `search_markdown_pages` - Search pages
- `create_markdown_page` - Create a new page
- `update_markdown_page` - Update a page
- `delete_markdown_page` - Delete a page
- `get_markdown_tree` - Get hierarchical tree
- `get_markdown_versions` - Get version history
- `restore_markdown_version` - Restore a previous version

### Quick Notes AI Tools (submodule: `quick-notes`)

- `get_quick_notes` - Retrieve all quick notes
- `get_quick_note` - Get a specific quick note
- `search_quick_notes` - Search quick notes
- `create_quick_note` - Create a new quick note
- `update_quick_note` - Update a quick note
- `delete_quick_note` - Archive a quick note
- `pin_quick_note` - Toggle pinned state
- `archive_quick_note` - Toggle archive state
- `toggle_quick_note_checklist_item` - Toggle a checklist item
- `update_quick_note_checklist` - Update the entire checklist

## Development

### Running Tests

```bash
cd modules/MoLOS-Markdown
bun run test
```

### Database Migrations

```bash
cd modules/MoLOS-Markdown
bun run db:generate  # Generate migration from schema
bun run db:migrate  # Run pending migrations
bun run db:studio  # Open Drizzle Studio
```

## License

MIT

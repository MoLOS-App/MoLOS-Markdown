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

### Documents Stores

```typescript
import {
	selectedPageId,
	selectedPage,
	expandedNodes,
	searchQuery,
	tagFilter,
	pages,
	tree,
	templates
} from '$lib/stores/MoLOS-Markdown';
```

### Quick Notes Stores

```typescript
import {
	quickNotes,
	filteredNotes,
	selectedNoteId,
	showCreateDialog,
	activeFilter,
	searchQuery
} from '$lib/stores/MoLOS-Markdown/quick-notes';
```

## AI Tools

The module exposes AI tools for use with MoLOS AI system:

### Documents AI Tools

- `get_markdown_pages` - Retrieve all pages
- `get_markdown_page` - Get a specific page
- `search_markdown_pages` - Search pages
- `create_markdown_page` - Create a new page
- `update_markdown_page` - Update a page
- `delete_markdown_page` - Delete a page
- `get_markdown_tree` - Get hierarchical tree
- `get_markdown_versions` - Get version history

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

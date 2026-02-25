# MoLOS-Markdown Module

Hierarchical markdown document management module for MoLOS with tree navigation, versioning, search, and templates support.

## Features

- **Hierarchical Navigation**: Tree-based document organization with folder support
- **Version Control**: Track and restore previous versions of documents
- **Search**: Full-text search across all documents
- **Templates**: Create reusable document templates
- **Tags**: Organize documents with flexible tagging system
- **RESTful API**: Complete CRUD operations via REST endpoints
- **AI Integration**: AI tools for document creation and management

## Installation

This module is included in the MoLOS monorepo and is automatically loaded when the module is enabled in the configuration.

## API Endpoints

### Pages

- `GET /api/MoLOS-Markdown/markdown` - List all pages (supports query params: `?tree=true`, `?templates=true`, `?q=search`, `?path=/path`)
- `POST /api/MoLOS-Markdown/markdown` - Create a new page
- `GET /api/MoLOS-Markdown/markdown/[id]` - Get a specific page
- `PATCH /api/MoLOS-Markdown/markdown/[id]` - Update a page
- `DELETE /api/MoLOS-Markdown/markdown/[id]` - Delete a page

### Versions

- `GET /api/MoLOS-Markdown/markdown/[id]/versions` - Get version history
- `POST /api/MoLOS-Markdown/markdown/[id]/restore` - Restore from a previous version

### Templates

- `GET /api/MoLOS-Markdown/templates` - List all templates
- `POST /api/MoLOS-Markdown/templates` - Create a new template

### Search

- `GET /api/MoLOS-Markdown/search?q=query&limit=20` - Search pages (integrated with global search)

## Database Schema

### Pages Table (`MoLOS-Markdown_pages`)

| Column | Type | Description |
|--------|-------|-------------|
| id | text | Primary key |
| userId | text | User ID |
| title | text | Page title |
| slug | text | URL-friendly slug |
| content | text | Markdown content |
| isTemplate | integer | Template flag |
| parentPageId | text | Parent page ID (for hierarchy) |
| path | text | Hierarchical path (e.g., `/docs/api`) |
| tags | text | JSON array of tags |
| version | integer | Current version number |
| createdAt | integer | Creation timestamp |
| updatedAt | integer | Last update timestamp |

**Indexes**:
- `idx_markdown_pages_user_id`
- `idx_markdown_pages_parent_page_id`
- `idx_markdown_pages_path`
- `idx_markdown_pages_slug`
- `idx_markdown_pages_updated_at`

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
- `idx_markdown_versions_page_id`
- `idx_markdown_versions_user_id`
- `idx_markdown_versions_version`

## Usage

### Creating a Page

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

### Updating a Page

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

### Getting Version History

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown/page-id/versions');
const versions = await response.json();
```

### Restoring a Version

```typescript
const response = await fetch('/api/MoLOS-Markdown/markdown/page-id/restore', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ version: 2 })
});
```

## Stores

The module provides Svelte stores for client-side state management:

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

// Subscribe to stores
selectedPageId.subscribe(id => console.log('Selected:', id));
```

## AI Tools

The module exposes AI tools for use with the MoLOS AI system:

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

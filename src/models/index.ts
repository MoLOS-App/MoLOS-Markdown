// ============== ENUMS ==============

export const NodeType = {
	FOLDER: 'folder',
	PAGE: 'page'
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

// ============== INTERFACE DEFINITIONS ==============

export interface MarkdownPage {
	id: string;
	userId: string;
	title: string;
	slug: string;
	content: string;
	isTemplate: boolean;
	parentPageId?: string;
	path?: string;
	tags?: string;
	version: number;
	createdAt: number;
	updatedAt: number;
}

export interface MarkdownVersion {
	id: string;
	userId: string;
	pageId: string;
	version: number;
	content: string;
	changeDescription?: string;
	createdAt: number;
}

// ============== INPUT TYPES ==============

export interface CreateMarkdownPageInput {
	title: string;
	content: string;
	parentPageId?: string;
	path?: string;
	tags?: string[];
}

// ============== TREE NODE TYPES ==============
export interface TreeNode {
	id: string;
	title: string;
	path: string;
	type: NodeType;
	slug: string;
	children?: TreeNode[];
	expanded?: boolean;
}

// ============== QUICK NOTES TYPES ==============

export const NoteColor = {
	DEFAULT: 'default',
	RED: 'red',
	ORANGE: 'orange',
	YELLOW: 'yellow',
	GREEN: 'green',
	TEAL: 'teal',
	BLUE: 'blue',
	DARK_BLUE: 'dark-blue',
	PURPLE: 'purple',
	PINK: 'pink',
	BROWN: 'brown',
	GRAY: 'gray'
} as const;

export type NoteColor = (typeof NoteColor)[keyof typeof NoteColor];

export interface QuickNoteChecklistItem {
	id: string;
	text: string;
	isChecked: boolean;
	sortOrder?: number;
}

 export interface QuickNote {
	id: string;
	userId: string;
	title?: string;
	content: string;
	color?: string;
	isPinned: boolean;
	isArchived: boolean;
	labels: string[];
	checklist: QuickNoteChecklistItem[];
	position: number;
	createdAt: number;
	updatedAt: number;
}

export interface CreateQuickNoteInput {
	userId?: string;
	title?: string;
	content: string;
	color?: string;
	labels?: string[];
}

 export interface UpdateQuickNoteInput extends Partial<CreateQuickNoteInput> {
	id?: string;
	isPinned?: boolean;
	isArchived?: boolean;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
	execute: (params: any) => Promise<any>;
}

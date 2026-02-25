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

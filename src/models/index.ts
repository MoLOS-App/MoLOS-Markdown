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

// Legacy alias for backwards compatibility
export type KnowledgePage = MarkdownPage;

export interface MarkdownVersion {
	id: string;
	userId: string;
	pageId: string;
	version: number;
	content: string;
	changeDescription?: string;
	createdAt: number;
}

// Legacy alias for backwards compatibility
export type KnowledgeVersion = MarkdownVersion;

// ============== INPUT TYPES ==============

export interface CreateMarkdownPageInput {
	title: string;
	content: string;
	parentPageId?: string;
	path?: string;
	tags?: string[];
}

// Legacy alias for backwards compatibility
export type CreateKnowledgePageInput = CreateMarkdownPageInput;

// ============== TREE NODE TYPES ==============
export interface TreeNode {
	id: string;
	title: string;
	path: string;
	type: "folder" | "page";
	slug: string;
	children?: TreeNode[];
	expanded?: boolean;
}

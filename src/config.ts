import { BookOpen, FileText } from 'lucide-svelte';
import type { ModuleConfig } from '@molos/module-types';

export const moduleConfig: ModuleConfig = {
	id: "MoLOS-Markdown",
	name: "Markdown",
	href: "/ui/MoLOS-Markdown",
	icon: BookOpen,
	description: "Hierarchical markdown document management with tree navigation, versioning, and search",
	navigation: [
		{
			name: "Documents",
			icon: BookOpen,
			href: "/ui/MoLOS-Markdown"
		},
		{
			name: "Quick Notes",
			icon: FileText,
			href: "/ui/MoLOS-Markdown/quick-notes"
		}
	]
};

export default moduleConfig;

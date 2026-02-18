import { BookOpen } from "lucide-svelte";
import type { ModuleConfig } from '$lib/config/types';

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
		}
	]
};

export default moduleConfig;

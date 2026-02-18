<script lang="ts">
	import type { LayoutData } from "./$types";

	interface Props {
		data: LayoutData;
	}

	let { data, children }: Props = $props();
</script>

<div class="flex h-screen pr-4 overflow-hidden bg-background">
	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>

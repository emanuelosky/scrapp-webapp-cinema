<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	let { children } = $props();
</script>

<div class="min-h-screen bg-black font-sans antialiased text-zinc-50">
	<Toaster theme="dark" position="bottom-right" />
	{@render children()}
</div>

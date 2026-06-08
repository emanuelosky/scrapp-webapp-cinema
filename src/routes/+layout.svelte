<script lang="ts">
	import './layout.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-zinc-950 font-sans antialiased text-zinc-50">
	{@render children()}
</div>

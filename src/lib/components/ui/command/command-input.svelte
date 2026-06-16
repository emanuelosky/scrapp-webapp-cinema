<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<div class="flex items-center border-b border-zinc-900 px-6 py-2 bg-black" data-slot="command-input-wrapper">
	<CommandPrimitive.Input
		bind:value
		bind:ref
		data-slot="command-input"
		class={cn(
			"flex h-16 w-full rounded-none bg-transparent py-4 text-2xl md:text-3xl font-black uppercase outline-none placeholder:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 text-white",
			className
		)}
		{...restProps}
	/>
</div>

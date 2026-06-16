<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"relative flex cursor-pointer select-none items-center rounded-none border-b border-zinc-900 px-4 py-3 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
		"data-[selected=true]:bg-white data-[selected=true]:text-black",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<CheckIcon class="cn-command-item-indicator ml-auto opacity-0 group-has-[[data-slot=command-shortcut]]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
</CommandPrimitive.Item>

<script lang="ts">
	import { navigating } from '$app/stores';

	// Cambiar de sede implica pedir la cartelera de ese cine, y eso tarda.
	// Sin esto la página anterior se quedaba congelada sin explicar nada.
	// Esperamos ~120ms antes de mostrar la barra: por debajo de eso el
	// parpadeo estorba más de lo que informa.
	let visible = $state(false);

	$effect(() => {
		if (!$navigating) {
			visible = false;
			return;
		}
		const timer = setTimeout(() => {
			visible = true;
		}, 120);
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div class="nav-progress" role="status" aria-label="Cargando la página">
		<div class="nav-progress__bar"></div>
	</div>
{/if}

<style>
	.nav-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 200;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.06);
		pointer-events: none;
	}

	.nav-progress__bar {
		height: 100%;
		width: 35%;
		border-radius: 9999px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-champagne-400, #e5c48a),
			transparent
		);
		animation: nav-progress-slide 1.1s ease-in-out infinite;
	}

	@keyframes nav-progress-slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(340%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-progress__bar {
			animation-duration: 2.6s;
		}
	}
</style>

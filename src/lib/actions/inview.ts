export function inview(node: HTMLElement, { threshold = 0.2, once = true, onEnter = () => {} } = {}) {
	let observer: IntersectionObserver;

	const handleIntersect = (entries: IntersectionObserverEntry[]) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				node.classList.add('is-visible');
				onEnter();
				node.dispatchEvent(new CustomEvent('inview'));
				if (once) {
					observer.unobserve(node);
				}
			} else if (!once) {
				node.classList.remove('is-visible');
			}
		});
	};

	observer = new IntersectionObserver(handleIntersect, { threshold });
	observer.observe(node);

	return {
		update(newOptions: { threshold?: number; once?: boolean; onEnter?: () => void }) {
			onEnter = newOptions.onEnter ?? onEnter;
			observer.disconnect();
			observer = new IntersectionObserver(handleIntersect, {
				threshold: newOptions.threshold ?? threshold
			});
			observer.observe(node);
		},
		destroy() {
			observer.disconnect();
		}
	};
}

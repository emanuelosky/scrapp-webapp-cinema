import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const titles: Record<string, string> = {
		'1': 'Dune:\nPart Two',
		'2': 'Deadpool &\nWolverine',
		'3': 'Inside\nOut 2',
		'4': 'Alien:\nRomulus',
		'5': 'Oppenheimer'
	};
	
	const title = titles[params.id] || 'Movie';
	
	// Create a beautiful, premium dark-amber gradient SVG poster
	const svg = `
<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#18181b" />
			<stop offset="100%" stop-color="#09090b" />
		</linearGradient>
		<linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#fcd34d" />
			<stop offset="100%" stop-color="#b45309" />
		</linearGradient>
	</defs>
	<!-- Background -->
	<rect width="500" height="750" fill="url(#bgGrad)"/>
	
	<!-- Inner Border -->
	<rect x="20" y="20" width="460" height="710" fill="none" stroke="#d97706" stroke-width="2" opacity="0.3"/>
	
	<!-- Title Text -->
	<text x="250" y="350" font-family="system-ui, sans-serif" font-weight="900" font-size="52" fill="url(#textGrad)" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">
		${title.split('\n').map((line, i) => `<tspan x="250" dy="${i === 0 ? 0 : 65}">${line.toUpperCase().replace(/&/g, '&amp;')}</tspan>`).join('')}
	</text>
	
	<!-- Footer Text -->
	<text x="250" y="700" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#71717a" text-anchor="middle" letter-spacing="4">
		CINEPIC STUDIOS
	</text>
</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=31536000'
		}
	});
};

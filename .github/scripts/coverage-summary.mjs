// Renders Vitest's json-summary coverage report as a Markdown table for the CI job summary.
import { readFileSync } from 'node:fs';

const [file] = process.argv.slice(2);
const { total } = JSON.parse(readFileSync(file, 'utf8'));
const metrics = ['lines', 'statements', 'functions', 'branches'];

const rows = metrics.map((metric) => {
	const { pct, covered, total: count } = total[metric];
	return `| ${metric[0].toUpperCase()}${metric.slice(1)} | ${pct}% | ${covered} / ${count} |`;
});

console.log(
	['## Coverage', '', '| Metric | Coverage | Covered |', '| --- | ---: | ---: |', ...rows].join(
		'\n'
	)
);

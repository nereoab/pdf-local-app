import * as fs from 'fs';
import * as path from 'path';
import { LONG_TAIL_SOLUTIONS_PT, SOLUTION_PAIRS_ES_TO_PT } from '../lib/long-tail-pt';

const routes = Object.keys(LONG_TAIL_SOLUTIONS_PT).map((slug) => `/pt/solutions/${slug}`);
const pairs: Record<string, string> = {};

for (const [esSlug, ptSlug] of Object.entries(SOLUTION_PAIRS_ES_TO_PT)) {
  pairs[`/soluciones/${esSlug}`] = `/pt/solutions/${ptSlug}`;
}

const outData = {
  routes,
  pairs,
};

const outPath = path.join(__dirname, '..', 'lib', 'long-tail', 'pt-solutions-routes.json');
fs.writeFileSync(outPath, JSON.stringify(outData, null, 2), 'utf8');
console.log(`Saved ${routes.length} Portuguese solution routes to ${outPath}`);

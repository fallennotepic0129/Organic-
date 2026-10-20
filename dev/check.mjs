// Runs Shopify Theme Check against the theme root (one level up).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themeCheckRun } from '@shopify/theme-check-node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { offenses } = await themeCheckRun(root, undefined, () => {});
const sev = ['error', 'warning', 'info'];
for (const o of offenses) {
  console.log(`${sev[o.severity] || o.severity}\t${path.relative(root, o.uri.replace('file://', ''))}:${o.start.line + 1}\t${o.check}\t${o.message}`);
}
console.log(`\n${offenses.length} offense(s)`);
process.exit(offenses.some((o) => o.severity === 0) ? 1 : 0);

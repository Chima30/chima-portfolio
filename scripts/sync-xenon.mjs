// Builds XENON's reusable Video.js v10 skin (src/skin in the XENON repository) into vendor/xenon, using XENON's own
// Vite. Only the skin is built: none of XENON's demo app (catalogue, Test Lab, wheel data, My Atlas) comes along.
// React, Video.js and the Space Grotesk font stay external, so the portfolio provides them from its own packages.
//
// Usage, from the portfolio folder, with a XENON checkout that has had `npm install`:
//   node scripts/sync-xenon.mjs ../Xenon
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const xenon = path.resolve(process.argv[2] ?? '../Xenon');
const entry = path.join(xenon, 'src/skin/index.ts');
if (!existsSync(entry)) {
  console.error(`No XENON skin at ${entry}. Pass the path to a XENON checkout: node scripts/sync-xenon.mjs ../Xenon`);
  process.exit(1);
}
const req = createRequire(path.join(xenon, 'package.json'));
const { build } = await import(pathToFileURL(req.resolve('vite')).href);
const react = (await import(pathToFileURL(req.resolve('@vitejs/plugin-react')).href)).default;
const out = path.resolve('vendor/xenon');

await build({
  root: xenon,
  configFile: false,
  logLevel: 'warn',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: out,
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: { entry, formats: ['es'], fileName: () => 'xenon-skin.js', cssFileName: 'xenon-skin' },
    rollupOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/, /^@videojs\//, /^@fontsource/] },
  },
});

// Record exactly which XENON this came from.
let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: xenon }).toString().trim();
} catch {}
const pkg = JSON.parse(readFileSync(path.join(xenon, 'package.json'), 'utf8'));
writeFileSync(
  path.join(out, 'SOURCE.json'),
  JSON.stringify(
    { from: 'https://github.com/Chima30/Xenon', path: 'src/skin', commit, videojs: pkg.dependencies?.['@videojs/react'], builtAt: new Date().toISOString().slice(0, 10) },
    null,
    2,
  ) + '\n',
);
console.log(`XENON skin (${commit}) built into ${path.relative(process.cwd(), out)}`);

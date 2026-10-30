import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const entryPoint = path.resolve('storefront-widget/src/index.jsx');
const outfile = path.resolve('extensions/countdown-timer/assets/countdown-timer.js');

async function build() {
  console.log('Building Preact Storefront Widget...');

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    jsxImportSource: 'preact',
    outfile,
    metafile: true,
  });

  const fileBytes = fs.readFileSync(outfile);
  const gzipped = zlib.gzipSync(fileBytes);

  const rawKb = (fileBytes.length / 1024).toFixed(2);
  const gzipKb = (gzipped.length / 1024).toFixed(2);

  console.log(`Widget build complete:`);
  console.log(`  Raw size: ${rawKb} KB`);
  console.log(`  Gzipped size: ${gzipKb} KB`);

  const MAX_GZIP_KB = 30.0;
  if (gzipped.length / 1024 > MAX_GZIP_KB) {
    console.error(`ERROR: Bundle exceeded target of ${MAX_GZIP_KB} KB gzipped! (Actual: ${gzipKb} KB)`);
    process.exit(1);
  } else {
    console.log(`PASS: Bundle is well under the 30 KB gzipped limit!`);
  }
}

build().catch((err) => {
  console.error('Widget build failed:', err);
  process.exit(1);
});

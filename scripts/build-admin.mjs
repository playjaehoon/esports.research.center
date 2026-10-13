import { build } from 'esbuild';
await build({entryPoints:['admin/app.js'],bundle:true,format:'esm',platform:'browser',target:['es2022'],outfile:'admin/app.bundle.js',minify:true});

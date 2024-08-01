import * as esbuild from 'esbuild';
import {dtsPlugin} from 'esbuild-plugin-d.ts';
import {nodeExternalsPlugin} from 'esbuild-node-externals';

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: './dist/cjs/index.js',
  // We need to bundle svgdom in the cjs build as a polyfill is needed to support import.meta.url
  define: {
    'import.meta.url': 'importMetaUrl',
  },
  inject: ['./script/cjs_shims.js'],
  plugins: [
    nodeExternalsPlugin({allowList: ['svgdom']}),
    dtsPlugin({experimentalBundling: true, tsconfig: 'tsconfig.cjs.json'}),
  ],
});

await esbuild.build({
  entryPoints: ['./src/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: './dist/cli.js',
  plugins: [
    nodeExternalsPlugin(),
  ],
});

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  outfile: './dist/esm/index.js',
  plugins: [
    nodeExternalsPlugin(),
    dtsPlugin({experimentalBundling: true}),
  ],
});

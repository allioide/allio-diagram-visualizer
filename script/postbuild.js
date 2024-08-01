import {readFileSync, writeFileSync} from 'node:fs';

// create package.json in dist/cjs
writeFileSync('./dist/cjs/package.json',  '{\"type\": \"commonjs\"}');

// create package.json in dist/esm
writeFileSync('./dist/esm/package.json',  '{\"type\": \"module\"}');

// insert "#!/usr/bin/env node" to cli.js
const content = readFileSync('./dist/cli.js', 'utf8');
writeFileSync('./dist/cli.js', '#!/usr/bin/env node\n' + content);
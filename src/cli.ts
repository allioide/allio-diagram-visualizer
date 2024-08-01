import * as fs from 'node:fs/promises';
import {Command} from 'commander';
import {renderSvg} from './render.js';
import {getNodeCanvas} from './canvas.js';
import {loadDiagram} from './loader.js';

async function main(): Promise<void> {
  const program = new Command();
  program
    .requiredOption('-i, --input <input-path>', 'path to the input diagram file')
    .option('-o, --output <output-path>', 'path to the output image file', 'output.svg')
    .version('0.0.1');
  program.parse();

  const options = program.opts();
  const fileContent = await fs.readFile(options.input as string, 'utf8');
  const diagram = loadDiagram(fileContent);
  const canvas = getNodeCanvas();
  const svg = renderSvg(diagram, canvas);
  await fs.writeFile(options.output as string, svg);
}

await main();

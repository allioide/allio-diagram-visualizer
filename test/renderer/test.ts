
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import test, {type ExecutionContext} from 'ava';
import xmlFormat from 'xml-formatter';
import {loadDiagram} from '../../src/loader.js';
import {getNodeCanvas} from '../../src/canvas.js';
import {renderSvg} from '../../src/render.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function renderDiagram(filename: string, embeddedFont = false): Promise<string> {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  const diagram = loadDiagram(fileContent);
  const canvas = getNodeCanvas(embeddedFont);
  const svg = renderSvg(diagram, canvas);
  await mkdir(path.join(dirname, 'results'), {recursive: true});
  await writeFile(path.join(dirname, 'results', filename.split('.')[0] + '.svg'), svg);
  return xmlFormat(svg, {lineSeparator: '\n'});
}

async function runTest(t: ExecutionContext, filename: string): Promise<boolean> {
  return t.notThrowsAsync(async () => {
    const svg = await renderDiagram(filename);
    t.snapshot(svg);
  });
}

test('empty diagram', async t => runTest(t, 'empty.alliodiagram'));

test('single command block', async t => runTest(t, 'single_command.alliodiagram'));

test('command block with short name', async t => runTest(t, 'command_name_short.alliodiagram'));

test('command block with long name', async t => runTest(t, 'command_name_long.alliodiagram'));


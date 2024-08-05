
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

test('command block with expression', async t => runTest(t, 'command_with_expression.alliodiagram'));

test('transition with one condition', async t => runTest(t, 'transition_with_one_condition.alliodiagram'));

test('transition with two condition', async t => runTest(t, 'transition_with_two_conditions.alliodiagram'));

test('transition with condition and expression (1/2)', async t => runTest(t, 'transition_with_condition_and_expression_1.alliodiagram'));

test('transition with condition and expression (2/2)', async t => runTest(t, 'transition_with_condition_and_expression_2.alliodiagram'));

test('diagram branch vspace calculation (1/8)', async t => runTest(t, 'diagram_branch_vspace_1.alliodiagram'));

test('diagram branch vspace calculation (2/8)', async t => runTest(t, 'diagram_branch_vspace_2.alliodiagram'));

test('diagram branch vspace calculation (3/8)', async t => runTest(t, 'diagram_branch_vspace_3.alliodiagram'));

test('diagram branch vspace calculation (4/8)', async t => runTest(t, 'diagram_branch_vspace_4.alliodiagram'));

test('diagram branch vspace calculation (5/8)', async t => runTest(t, 'diagram_branch_vspace_5.alliodiagram'));

test('diagram branch vspace calculation (6/8)', async t => runTest(t, 'diagram_branch_vspace_6.alliodiagram'));

test('diagram branch vspace calculation (7/8)', async t => runTest(t, 'diagram_branch_vspace_7.alliodiagram'));

test('diagram branch vspace calculation (8/8)', async t => runTest(t, 'diagram_branch_vspace_8.alliodiagram'));

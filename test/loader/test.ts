import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import test from 'ava';
import {loadDiagram} from '../../src/loader.js';
import {DiagramValidationError} from '../../src/util/errors.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

test('empty diagram', async t => {
  const fileContent = await readFile(path.join(dirname, 'assets', 'empty.alliodiagram'), 'utf8');
  t.notThrows(() => loadDiagram(fileContent));
});

test('error when missing devices section', async t => {
  const fileContent = await readFile(path.join(dirname, 'assets', 'missing_devices_section.alliodiagram'), 'utf8');
  const error = t.throws(() => loadDiagram(fileContent));
  if (error instanceof DiagramValidationError) {
    // TODO: check error message
    t.pass();
  } else {
    t.fail();
  }
});

test('error when missing diagrams section', async t => {
  const fileContent = await readFile(path.join(dirname, 'assets', 'missing_diagrams_section.alliodiagram'), 'utf8');
  const error = t.throws(() => loadDiagram(fileContent));
  if (error instanceof DiagramValidationError) {
    t.pass();
  } else {
    t.fail();
  }
});

test.failing('error when missing end block', async t => {
  const fileContent = await readFile(path.join(dirname, 'assets', 'missing_end_or_back_1.alliodiagram'), 'utf8');
  const error = t.throws(() => loadDiagram(fileContent));
  if (error instanceof DiagramValidationError) {
    t.pass();
  } else {
    t.fail();
  }
});

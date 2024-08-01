import {parse} from 'yaml';
import {Ajv} from 'ajv';
import allioDiagramSchema from './schema/alliodiagram.json' with { type: 'json' };
import {type ALLIODiagram} from './schema/alliodiagram.js'; // FIXME: remove Expression1
import {DiagramValidationError} from './util/errors.js';

const ajv = new Ajv();
const validator = ajv.compile<ALLIODiagram>(allioDiagramSchema);

export function loadDiagram(fileContent: string): ALLIODiagram {
  const diagram = parse(fileContent) as unknown;
  if (!validator(diagram)) {
    throw new DiagramValidationError(validator.errors!);
  }

  // TODO: additional validataion not cover by the schema
  return diagram;
}

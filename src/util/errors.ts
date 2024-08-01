import {type ErrorObject} from 'ajv';

export class DiagramValidationError extends Error {
  errors: ErrorObject[];

  constructor(errors: ErrorObject[]) {
    super();
    // FIXME: parse error and store in custom format
    this.errors = errors;
  }
}

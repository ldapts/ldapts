import { ResultCodeError } from './ResultCodeError';

export class TypeOrValueExistsError extends ResultCodeError {
  constructor() {
    super(20, 'The attribute value specified in a Add Request or Modify Request operation already exists as a value for that attribute.');
  }
}

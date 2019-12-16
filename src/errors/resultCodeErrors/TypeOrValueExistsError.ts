import { ResultCodeError } from './ResultCodeError';

export class TypeOrValueExistsError extends ResultCodeError {
  public constructor(message?: string) {
    super(20, message || 'The attribute value specified in a Add Request or Modify Request operation already exists as a value for that attribute.');
  }
}

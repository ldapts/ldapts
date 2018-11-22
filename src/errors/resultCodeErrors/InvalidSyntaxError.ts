import { ResultCodeError } from './ResultCodeError';

export class InvalidSyntaxError extends ResultCodeError {
  constructor() {
    super(21, 'The attribute value specified in an Add Request, Compare Request, or Modify Request operation is an unrecognized or invalid syntax for the attribute.');
  }
}

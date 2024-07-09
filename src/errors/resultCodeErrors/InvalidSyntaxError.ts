import { ResultCodeError } from './ResultCodeError.js';

export class InvalidSyntaxError extends ResultCodeError {
  public constructor(message?: string) {
    super(21, message ?? 'The attribute value specified in an Add Request, Compare Request, or Modify Request operation is an unrecognized or invalid syntax for the attribute.');

    this.name = 'InvalidSyntaxError';
    Object.setPrototypeOf(this, InvalidSyntaxError.prototype);
  }
}

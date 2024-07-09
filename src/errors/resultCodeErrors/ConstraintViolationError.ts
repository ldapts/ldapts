import { ResultCodeError } from './ResultCodeError.js';

export class ConstraintViolationError extends ResultCodeError {
  public constructor(message?: string) {
    super(
      19,
      message ??
        'The attribute value specified in a Add Request, Modify Request or ModifyDNRequest operation violates constraints placed on the attribute. The constraint can be one of size or content (string only, no binary).',
    );

    this.name = 'ConstraintViolationError';
    Object.setPrototypeOf(this, ConstraintViolationError.prototype);
  }
}

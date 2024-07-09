import { ResultCodeError } from './ResultCodeError.js';

export class InsufficientAccessError extends ResultCodeError {
  public constructor(message?: string) {
    super(50, message ?? 'The caller does not have sufficient rights to perform the requested operation.');

    this.name = 'InsufficientAccessError';
    Object.setPrototypeOf(this, InsufficientAccessError.prototype);
  }
}

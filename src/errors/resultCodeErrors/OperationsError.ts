import { ResultCodeError } from './ResultCodeError.js';

export class OperationsError extends ResultCodeError {
  public constructor(message?: string) {
    super(1, message ?? 'Request was out of sequence with another operation in progress.');

    this.name = 'OperationsError';
    Object.setPrototypeOf(this, OperationsError.prototype);
  }
}

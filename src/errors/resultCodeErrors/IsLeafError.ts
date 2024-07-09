import { ResultCodeError } from './ResultCodeError.js';

export class IsLeafError extends ResultCodeError {
  public constructor(message?: string) {
    super(35, message ?? 'The specified operation cannot be performed on a leaf entry.');

    this.name = 'IsLeafError';
    Object.setPrototypeOf(this, IsLeafError.prototype);
  }
}

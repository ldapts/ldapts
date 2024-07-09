import { ResultCodeError } from './ResultCodeError.js';

export class UnknownStatusCodeError extends ResultCodeError {
  public constructor(code: number, message?: string) {
    super(code, message ?? 'Unknown error.');

    this.name = 'UnknownStatusCodeError';
    Object.setPrototypeOf(this, UnknownStatusCodeError.prototype);
  }
}

import { ResultCodeError } from './ResultCodeError.js';

export class ResultsTooLargeError extends ResultCodeError {
  public constructor(message?: string) {
    super(70, message ?? 'Results are too large.');

    this.name = 'ResultsTooLargeError';
    Object.setPrototypeOf(this, ResultsTooLargeError.prototype);
  }
}

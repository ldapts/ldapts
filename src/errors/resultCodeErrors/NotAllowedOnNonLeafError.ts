import { ResultCodeError } from './ResultCodeError.js';

export class NotAllowedOnNonLeafError extends ResultCodeError {
  public constructor(message?: string) {
    super(66, message ?? 'The requested operation is permitted only on leaf entries.');

    this.name = 'NotAllowedOnNonLeafError';
    Object.setPrototypeOf(this, NotAllowedOnNonLeafError.prototype);
  }
}

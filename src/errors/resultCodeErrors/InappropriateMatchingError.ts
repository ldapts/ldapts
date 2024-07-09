import { ResultCodeError } from './ResultCodeError.js';

export class InappropriateMatchingError extends ResultCodeError {
  public constructor(message?: string) {
    super(18, message ?? "The matching rule specified in the search filter does not match a rule defined for the attribute's syntax.");

    this.name = 'InappropriateMatchingError';
    Object.setPrototypeOf(this, InappropriateMatchingError.prototype);
  }
}

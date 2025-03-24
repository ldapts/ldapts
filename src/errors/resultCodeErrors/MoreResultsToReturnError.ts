import { ResultCodeError } from './ResultCodeError.js';

export class MoreResultsToReturnError extends ResultCodeError {
  public constructor(message: string) {
    super(95, message);
    this.name = 'MoreResultsToReturnError';
    Object.setPrototypeOf(this, MoreResultsToReturnError.prototype);
  }
}

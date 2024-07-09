import { ResultCodeError } from './ResultCodeError.js';

export class SizeLimitExceededError extends ResultCodeError {
  public constructor(message?: string) {
    super(4, message ?? 'There were more entries matching the criteria contained in a SearchRequest operation than were allowed to be returned by the size limit configuration.');

    this.name = 'SizeLimitExceededError';
    Object.setPrototypeOf(this, SizeLimitExceededError.prototype);
  }
}

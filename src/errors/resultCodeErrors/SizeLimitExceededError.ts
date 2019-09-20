import { ResultCodeError } from './ResultCodeError';

export class SizeLimitExceededError extends ResultCodeError {
  constructor(message?: string) {
    super(4, message || 'There were more entries matching the criteria contained in a SearchRequest operation than were allowed to be returned by the size limit configuration.');
  }
}

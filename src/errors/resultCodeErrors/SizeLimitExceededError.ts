import { ResultCodeError } from './ResultCodeError';

export class SizeLimitExceededError extends ResultCodeError {
  constructor() {
    super(4, 'There were more entries matching the criteria contained in a SearchRequest operation than were allowed to be returned by the size limit configuration.');
  }
}

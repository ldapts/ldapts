import { ResultCodeError } from './ResultCodeError';

export class InappropriateMatchingError extends ResultCodeError {
  constructor(message?: string) {
    super(18, message || 'The matching rule specified in the search filter does not match a rule defined for the attribute\'s syntax.');
  }
}

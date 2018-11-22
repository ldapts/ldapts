import { ResultCodeError } from './ResultCodeError';

export class InappropriateMatchingError extends ResultCodeError {
  constructor() {
    super(18, 'The matching rule specified in the search filter does not match a rule defined for the attribute\'s syntax.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class ResultsTooLargeError extends ResultCodeError {
  constructor(message?: string) {
    super(70, message || 'Results are too large.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class ResultsTooLargeError extends ResultCodeError {
  constructor() {
    super(70, 'Results are too large.');
  }
}

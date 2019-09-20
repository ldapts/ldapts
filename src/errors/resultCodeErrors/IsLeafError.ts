import { ResultCodeError } from './ResultCodeError';

export class IsLeafError extends ResultCodeError {
  constructor(message?: string) {
    super(35, message || 'The specified operation cannot be performed on a leaf entry.');
  }
}

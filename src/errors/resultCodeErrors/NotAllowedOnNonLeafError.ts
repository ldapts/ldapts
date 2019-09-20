import { ResultCodeError } from './ResultCodeError';

export class NotAllowedOnNonLeafError extends ResultCodeError {
  constructor(message?: string) {
    super(66, message || 'The requested operation is permitted only on leaf entries.');
  }
}

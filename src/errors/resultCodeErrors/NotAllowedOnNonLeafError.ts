import { ResultCodeError } from './ResultCodeError';

export class NotAllowedOnNonLeafError extends ResultCodeError {
  constructor() {
    super(66, 'The requested operation is permitted only on leaf entries.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class OperationsError extends ResultCodeError {
  constructor() {
    super(1, 'Request was out of sequence with another operation in progress.');
  }
}

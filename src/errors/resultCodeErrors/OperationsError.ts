import { ResultCodeError } from './ResultCodeError';

export class OperationsError extends ResultCodeError {
  constructor(message?: string) {
    super(1, message || 'Request was out of sequence with another operation in progress.');
  }
}

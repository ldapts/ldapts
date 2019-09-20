import { ResultCodeError } from './ResultCodeError';

export class InsufficientAccessError extends ResultCodeError {
  constructor(message?: string) {
    super(50, message || 'The caller does not have sufficient rights to perform the requested operation.');
  }
}

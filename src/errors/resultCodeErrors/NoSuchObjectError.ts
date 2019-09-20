import { ResultCodeError } from './ResultCodeError';

export class NoSuchObjectError extends ResultCodeError {
  constructor(message?: string) {
    super(32, message || 'The target object cannot be found.');
  }
}

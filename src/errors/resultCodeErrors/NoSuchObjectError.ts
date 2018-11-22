import { ResultCodeError } from './ResultCodeError';

export class NoSuchObjectError extends ResultCodeError {
  constructor() {
    super(32, 'The target object cannot be found.');
  }
}

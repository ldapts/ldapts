import { ResultCodeError } from './ResultCodeError';

export class InsufficientAccessError extends ResultCodeError {
  constructor() {
    super(50, 'The caller does not have sufficient rights to perform the requested operation.');
  }
}

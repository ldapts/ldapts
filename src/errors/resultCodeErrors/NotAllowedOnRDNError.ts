import { ResultCodeError } from './ResultCodeError';

export class NotAllowedOnRDNError extends ResultCodeError {
  constructor(message?: string) {
    super(67, message || 'The modify operation attempted to remove an attribute value that forms the entry\'s relative distinguished name.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class NotAllowedOnRDNError extends ResultCodeError {
  constructor() {
    super(67, 'The modify operation attempted to remove an attribute value that forms the entry\'s relative distinguished name.');
  }
}

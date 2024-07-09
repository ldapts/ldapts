import { ResultCodeError } from './ResultCodeError.js';

export class NotAllowedOnRDNError extends ResultCodeError {
  public constructor(message?: string) {
    super(67, message ?? "The modify operation attempted to remove an attribute value that forms the entry's relative distinguished name.");

    this.name = 'NotAllowedOnRDNError';
    Object.setPrototypeOf(this, NotAllowedOnRDNError.prototype);
  }
}

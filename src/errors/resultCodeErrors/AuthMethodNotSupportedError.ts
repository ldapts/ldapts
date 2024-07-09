import { ResultCodeError } from './ResultCodeError.js';

export class AuthMethodNotSupportedError extends ResultCodeError {
  public constructor(message?: string) {
    super(7, message ?? 'The Directory Server does not support the requested Authentication Method.');

    this.name = 'AuthMethodNotSupportedError';
    Object.setPrototypeOf(this, AuthMethodNotSupportedError.prototype);
  }
}

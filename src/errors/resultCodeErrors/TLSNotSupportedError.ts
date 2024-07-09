import { ResultCodeError } from './ResultCodeError.js';

export class TLSNotSupportedError extends ResultCodeError {
  public constructor(message?: string) {
    super(112, message ?? 'TLS is not supported on the server.');

    this.name = 'TLSNotSupportedError';
    Object.setPrototypeOf(this, TLSNotSupportedError.prototype);
  }
}

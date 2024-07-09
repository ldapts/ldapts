import { ResultCodeError } from './ResultCodeError.js';

export class InappropriateAuthError extends ResultCodeError {
  public constructor(message?: string) {
    super(48, message ?? 'The client is attempting to use an authentication method incorrectly.');

    this.name = 'InappropriateAuthError';
    Object.setPrototypeOf(this, InappropriateAuthError.prototype);
  }
}

import { ResultCodeError } from './ResultCodeError.js';

export class UnwillingToPerformError extends ResultCodeError {
  public constructor(message?: string) {
    super(53, message ?? 'The LDAP server cannot process the request because of server-defined restrictions.');

    this.name = 'UnwillingToPerformError';
    Object.setPrototypeOf(this, UnwillingToPerformError.prototype);
  }
}

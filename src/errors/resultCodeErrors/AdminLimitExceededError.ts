import { ResultCodeError } from './ResultCodeError.js';

export class AdminLimitExceededError extends ResultCodeError {
  public constructor(message?: string) {
    super(11, message ?? 'An LDAP server limit set by an administrative authority has been exceeded.');

    this.name = 'AdminLimitExceededError';
    Object.setPrototypeOf(this, AdminLimitExceededError.prototype);
  }
}

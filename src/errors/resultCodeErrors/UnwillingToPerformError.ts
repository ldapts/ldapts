import { ResultCodeError } from './ResultCodeError';

export class UnwillingToPerformError extends ResultCodeError {
  constructor(message?: string) {
    super(53, message || 'The LDAP server cannot process the request because of server-defined restrictions.');
  }
}

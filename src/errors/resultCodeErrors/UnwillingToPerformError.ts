import { ResultCodeError } from './ResultCodeError';

export class UnwillingToPerformError extends ResultCodeError {
  constructor() {
    super(53, 'The LDAP server cannot process the request because of server-defined restrictions.');
  }
}

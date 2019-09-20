import { ResultCodeError } from './ResultCodeError';

export class UnavailableError extends ResultCodeError {
  constructor(message?: string) {
    super(52, message || 'The LDAP server cannot process the client\'s bind request.');
  }
}

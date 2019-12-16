import { ResultCodeError } from './ResultCodeError';

export class UnavailableError extends ResultCodeError {
  public constructor(message?: string) {
    super(52, message || 'The LDAP server cannot process the client\'s bind request.');
  }
}

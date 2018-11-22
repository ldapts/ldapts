import { ResultCodeError } from './ResultCodeError';

export class UnavailableError extends ResultCodeError {
  constructor() {
    super(52, 'The LDAP server cannot process the client\'s bind request.');
  }
}

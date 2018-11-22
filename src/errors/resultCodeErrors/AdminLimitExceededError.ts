import { ResultCodeError } from './ResultCodeError';

export class AdminLimitExceededError extends ResultCodeError {
  constructor() {
    super(11, 'An LDAP server limit set by an administrative authority has been exceeded.');
  }
}

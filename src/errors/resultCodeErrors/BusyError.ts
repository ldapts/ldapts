import { ResultCodeError } from './ResultCodeError';

export class BusyError extends ResultCodeError {
  constructor(message?: string) {
    super(51, message || 'The LDAP server is too busy to process the client request at this time.');
  }
}

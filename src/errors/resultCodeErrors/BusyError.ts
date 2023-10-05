import { ResultCodeError } from './ResultCodeError.js';

export class BusyError extends ResultCodeError {
  public constructor(message?: string) {
    super(51, message ?? 'The LDAP server is too busy to process the client request at this time.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class BusyError extends ResultCodeError {
  constructor() {
    super(51, 'The LDAP server is too busy to process the client request at this time.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class ProtocolError extends ResultCodeError {
  constructor() {
    super(2, 'Client sent data to the server that did not comprise a valid LDAP request.');
  }
}

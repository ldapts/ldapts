import { ResultCodeError } from './ResultCodeError';

export class ProtocolError extends ResultCodeError {
  constructor(message?: string) {
    super(2, message || 'Client sent data to the server that did not comprise a valid LDAP request.');
  }
}

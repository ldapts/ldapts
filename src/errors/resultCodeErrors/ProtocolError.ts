import { ResultCodeError } from './ResultCodeError.js';

export class ProtocolError extends ResultCodeError {
  public constructor(message?: string) {
    super(2, message ?? 'Client sent data to the server that did not comprise a valid LDAP request.');

    this.name = 'ProtocolError';
    Object.setPrototypeOf(this, ProtocolError.prototype);
  }
}

import { ResultCodeError } from './ResultCodeError.js';

export class UnavailableCriticalExtensionError extends ResultCodeError {
  public constructor(message?: string) {
    super(
      12,
      message ?? 'One or more critical extensions were not available by the LDAP server. Either the server does not support the control or the control is not appropriate for the operation type.',
    );

    this.name = 'UnavailableCriticalExtensionError';
    Object.setPrototypeOf(this, UnavailableCriticalExtensionError.prototype);
  }
}

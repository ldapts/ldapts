import { ResultCodeError } from './ResultCodeError.js';

export class AffectsMultipleDSAsError extends ResultCodeError {
  public constructor(message?: string) {
    super(71, message ?? 'The modify DN operation moves the entry from one LDAP server to another and thus requires more than one LDAP server.');

    this.name = 'AffectsMultipleDSAsError';
    Object.setPrototypeOf(this, AffectsMultipleDSAsError.prototype);
  }
}

import { ResultCodeError } from './ResultCodeError';

export class AffectsMultipleDSAsError extends ResultCodeError {
  constructor() {
    super(71, 'The modify DN operation moves the entry from one LDAP server to another and thus requires more than one LDAP server.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class LoopDetectError extends ResultCodeError {
  constructor() {
    super(54, 'The client discovered an alias or LDAP Referral loop, and is thus unable to complete this request.');
  }
}

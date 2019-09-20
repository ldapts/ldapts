import { ResultCodeError } from './ResultCodeError';

export class LoopDetectError extends ResultCodeError {
  constructor(message?: string) {
    super(54, message || 'The client discovered an alias or LDAP Referral loop, and is thus unable to complete this request.');
  }
}

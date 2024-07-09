import { ResultCodeError } from './ResultCodeError.js';

export class LoopDetectError extends ResultCodeError {
  public constructor(message?: string) {
    super(54, message ?? 'The client discovered an alias or LDAP Referral loop, and is thus unable to complete this request.');

    this.name = 'LoopDetectError';
    Object.setPrototypeOf(this, LoopDetectError.prototype);
  }
}

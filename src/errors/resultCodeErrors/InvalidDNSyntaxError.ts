import { ResultCodeError } from './ResultCodeError.js';

export class InvalidDNSyntaxError extends ResultCodeError {
  public constructor(message?: string) {
    super(34, message ?? 'The syntax of the DN is incorrect.');

    this.name = 'InvalidDNSyntaxError';
    Object.setPrototypeOf(this, InvalidDNSyntaxError.prototype);
  }
}

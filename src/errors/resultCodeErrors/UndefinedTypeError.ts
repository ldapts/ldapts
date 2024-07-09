import { ResultCodeError } from './ResultCodeError.js';

export class UndefinedTypeError extends ResultCodeError {
  public constructor(message?: string) {
    super(17, message ?? "The attribute specified in the modify or add operation does not exist in the LDAP server's schema.");

    this.name = 'UndefinedTypeError';
    Object.setPrototypeOf(this, UndefinedTypeError.prototype);
  }
}

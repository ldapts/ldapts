import { ResultCodeError } from './ResultCodeError.js';

export class AliasDerefProblemError extends ResultCodeError {
  public constructor(message?: string) {
    super(36, message ?? "Either the client does not have access rights to read the aliased object's name or dereferencing is not allowed.");

    this.name = 'AliasDerefProblemError';
    Object.setPrototypeOf(this, AliasDerefProblemError.prototype);
  }
}

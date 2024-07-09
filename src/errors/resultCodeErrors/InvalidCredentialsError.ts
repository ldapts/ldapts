import { ResultCodeError } from './ResultCodeError.js';

export class InvalidCredentialsError extends ResultCodeError {
  public constructor(message?: string) {
    super(49, message ?? 'Invalid credentials during a bind operation.');

    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

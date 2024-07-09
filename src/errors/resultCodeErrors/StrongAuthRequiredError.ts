import { ResultCodeError } from './ResultCodeError.js';

export class StrongAuthRequiredError extends ResultCodeError {
  public constructor(message?: string) {
    super(8, message ?? 'Client requested an operation that requires strong authentication.');

    this.name = 'StrongAuthRequiredError';
    Object.setPrototypeOf(this, StrongAuthRequiredError.prototype);
  }
}

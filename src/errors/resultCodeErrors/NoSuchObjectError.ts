import { ResultCodeError } from './ResultCodeError.js';

export class NoSuchObjectError extends ResultCodeError {
  public constructor(message?: string) {
    super(32, message ?? 'The target object cannot be found.');

    this.name = 'NoSuchObjectError';
    Object.setPrototypeOf(this, NoSuchObjectError.prototype);
  }
}

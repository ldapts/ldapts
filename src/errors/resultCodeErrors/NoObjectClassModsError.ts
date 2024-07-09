import { ResultCodeError } from './ResultCodeError.js';

export class NoObjectClassModsError extends ResultCodeError {
  public constructor(message?: string) {
    super(69, message ?? 'The modify operation attempted to modify the structure rules of an object class.');

    this.name = 'NoObjectClassModsError';
    Object.setPrototypeOf(this, NoObjectClassModsError.prototype);
  }
}

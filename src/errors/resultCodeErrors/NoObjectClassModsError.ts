import { ResultCodeError } from './ResultCodeError';

export class NoObjectClassModsError extends ResultCodeError {
  constructor(message?: string) {
    super(69, message || 'The modify operation attempted to modify the structure rules of an object class.');
  }
}

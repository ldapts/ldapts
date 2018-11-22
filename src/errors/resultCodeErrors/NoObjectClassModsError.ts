import { ResultCodeError } from './ResultCodeError';

export class NoObjectClassModsError extends ResultCodeError {
  constructor() {
    super(69, 'The modify operation attempted to modify the structure rules of an object class.');
  }
}

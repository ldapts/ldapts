import { ResultCodeError } from './ResultCodeError';

export class NoSuchAttributeError extends ResultCodeError {
  public constructor(message?: string) {
    super(16, message || 'The attribute specified in the Modify Request or Compare Request operation does not exist in the entry.');
  }
}

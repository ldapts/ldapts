import { ResultCodeError } from './ResultCodeError';

export class NoSuchAttributeError extends ResultCodeError {
  constructor() {
    super(16, 'The attribute specified in the Modify Request or Compare Request operation does not exist in the entry.');
  }
}

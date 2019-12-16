import { ResultCodeError } from './ResultCodeError';

export class UnknownStatusCodeError extends ResultCodeError {
  public constructor(code: number, message?: string) {
    super(code, message || 'Unknown error.');
  }
}

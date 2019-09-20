import { ResultCodeError } from './ResultCodeError';

export class UnknownStatusCodeError extends ResultCodeError {
  constructor(code: number, message?: string) {
    super(code, message || 'Unknown error.');
  }
}

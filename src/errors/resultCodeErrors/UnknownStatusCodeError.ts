import { ResultCodeError } from './ResultCodeError';

export class UnknownStatusCodeError extends ResultCodeError {
  constructor(code: number) {
    super(code, 'Unknown error.');
  }
}

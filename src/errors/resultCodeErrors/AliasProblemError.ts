import { ResultCodeError } from './ResultCodeError';

export class AliasProblemError extends ResultCodeError {
  public constructor(message?: string) {
    super(33, message || 'An error occurred when an alias was dereferenced.');
  }
}

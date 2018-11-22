import { ResultCodeError } from './ResultCodeError';

export class AliasProblemError extends ResultCodeError {
  constructor() {
    super(33, 'An error occurred when an alias was dereferenced.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class InvalidCredentialsError extends ResultCodeError {
  constructor() {
    super(49, 'The client is attempting to use an authentication Method incorrectly.');
  }
}

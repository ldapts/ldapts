import { ResultCodeError } from './ResultCodeError';

export class InvalidCredentialsError extends ResultCodeError {
  constructor() {
    super(49, 'Invalid credentials during a bind operation.');
  }
}

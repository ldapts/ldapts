import { ResultCodeError } from './ResultCodeError';

export class InvalidCredentialsError extends ResultCodeError {
  public constructor(message?: string) {
    super(49, message || 'Invalid credentials during a bind operation.');
  }
}

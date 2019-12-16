import { ResultCodeError } from './ResultCodeError';

export class InappropriateAuthError extends ResultCodeError {
  public constructor(message?: string) {
    super(48, message || 'The client is attempting to use an authentication method incorrectly.');
  }
}

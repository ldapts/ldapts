import { ResultCodeError } from './ResultCodeError';

export class InappropriateAuthError extends ResultCodeError {
  constructor() {
    super(48, 'The client is attempting to use an authentication Method incorrectly.');
  }
}

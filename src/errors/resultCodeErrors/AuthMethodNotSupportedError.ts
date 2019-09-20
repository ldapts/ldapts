import { ResultCodeError } from './ResultCodeError';

export class AuthMethodNotSupportedError extends ResultCodeError {
  constructor(message?: string) {
    super(7, message || 'The Directory Server does not support the requested Authentication Method.');
  }
}

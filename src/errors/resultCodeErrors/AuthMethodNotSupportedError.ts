import { ResultCodeError } from './ResultCodeError';

export class AuthMethodNotSupportedError extends ResultCodeError {
  constructor() {
    super(7, 'The Directory Server does not support the requested Authentication Method.');
  }
}

import { ResultCodeError } from './ResultCodeError';

export class TLSNotSupportedError extends ResultCodeError {
  constructor(message?: string) {
    super(112, message || 'TLS is not supported on the server.');
  }
}

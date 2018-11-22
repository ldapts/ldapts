import { ResultCodeError } from './ResultCodeError';

export class TLSNotSupportedError extends ResultCodeError {
  constructor() {
    super(112, 'TLS is not supported on the server.');
  }
}

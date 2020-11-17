import { ResultCodeError } from './ResultCodeError';

export class SaslBindInProgressError extends ResultCodeError {
  public constructor(message?: string) {
    super(14, message || 'The server is ready for the next step in the SASL authentication process. The client must send the server the same SASL Mechanism to continue the process.');
  }
}

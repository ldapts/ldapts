import type { BindResponse } from '../../messages/BindResponse.js';

import { ResultCodeError } from './ResultCodeError.js';

export class SaslBindInProgressError extends ResultCodeError {
  public response: BindResponse;

  public constructor(response: BindResponse) {
    super(14, response.errorMessage || 'The server is ready for the next step in the SASL authentication process. The client must send the server the same SASL Mechanism to continue the process.');
    this.response = response;
    this.name = 'SaslBindInProgressError';

    Object.setPrototypeOf(this, SaslBindInProgressError.prototype);
  }
}

import { ResultCodeError } from './ResultCodeError.js';

export class ConfidentialityRequiredError extends ResultCodeError {
  public constructor(message?: string) {
    super(
      13,
      message ??
        'The session is not protected by a protocol such as Transport Layer Security (TLS), which provides session confidentiality and the request will not be handled without confidentiality enabled.',
    );

    this.name = 'ConfidentialityRequiredError';
    Object.setPrototypeOf(this, ConfidentialityRequiredError.prototype);
  }
}

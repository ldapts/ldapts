import { ResultCodeError } from './ResultCodeError';

export class ConfidentialityRequiredError extends ResultCodeError {
  constructor() {
    super(13, 'The session is not protected by a protocol such as Transport Layer Security (TLS), which provides session confidentiality and the request will not be handled without confidentiality enabled.');
  }
}

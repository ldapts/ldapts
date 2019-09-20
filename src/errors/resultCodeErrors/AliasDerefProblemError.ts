import { ResultCodeError } from './ResultCodeError';

export class AliasDerefProblemError extends ResultCodeError {
  constructor(message?: string) {
    super(36, message || 'Either the client does not have access rights to read the aliased object\'s name or dereferencing is not allowed.');
  }
}

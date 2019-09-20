import { ResultCodeError } from './ResultCodeError';

export class InvalidDNSyntaxError extends ResultCodeError {
  constructor(message?: string) {
    super(34, message || 'The syntax of the DN is incorrect.');
  }
}

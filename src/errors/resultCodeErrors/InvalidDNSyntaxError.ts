import { ResultCodeError } from './ResultCodeError';

export class InvalidDNSyntaxError extends ResultCodeError {
  constructor() {
    super(34, 'The syntax of the DN is incorrect.');
  }
}

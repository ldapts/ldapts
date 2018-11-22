import { ResultCodeError } from './ResultCodeError';

export class UndefinedTypeError extends ResultCodeError {
  constructor() {
    super(17, 'The attribute specified in the modify or add operation does not exist in the LDAP server\'s schema.');
  }
}

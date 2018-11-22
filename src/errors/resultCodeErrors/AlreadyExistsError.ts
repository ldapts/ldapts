import { ResultCodeError } from './ResultCodeError';

export class AlreadyExistsError extends ResultCodeError {
  constructor() {
    super(68, 'The add operation attempted to add an entry that already exists, or that the modify operation attempted to rename an entry to the name of an entry that already exists.');
  }
}

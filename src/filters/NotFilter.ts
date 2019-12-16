import { BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface NotFilterOptions {
  filter: Filter;
}

export class NotFilter extends Filter {
  public type: SearchFilter = SearchFilter.not;

  public filter: Filter;

  public constructor(options: NotFilterOptions) {
    super();
    this.filter = options.filter;
  }

  public writeFilter(writer: BerWriter): void {
    this.filter.write(writer);
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    return !this.filter.matches(objectToCheck, strictAttributeCase);
  }

  public toString(): string {
    return `(!${this.filter.toString()})`;
  }
}

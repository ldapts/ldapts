import { BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface OrFilterOptions {
  filters: Filter[];
}

export class OrFilter extends Filter {
  public type: SearchFilter = SearchFilter.or;
  public filters: Filter[];

  constructor(options: OrFilterOptions) {
    super();
    this.filters = options.filters;
  }

  public writeFilter(writer: BerWriter): void {
    for (const filter of this.filters) {
      filter.write(writer);
    }
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    if (!this.filters.length) {
      // per RFC4526
      return true;
    }

    for (const filter of this.filters) {
      if (filter.matches(objectToCheck, strictAttributeCase)) {
        return true;
      }
    }

    return false;
  }

  public toString(): string {
    let result: string = '(|';
    for (const filter of this.filters) {
      result += filter.toString();
    }
    result += ')';

    return result;
  }
}

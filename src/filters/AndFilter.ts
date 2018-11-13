// @ts-ignore
import { BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface AndFilterOptions {
  filters: Filter[];
}

export class AndFilter extends Filter {
  public type: SearchFilter = SearchFilter.and;
  public filters: Filter[];

  constructor(options: AndFilterOptions) {
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
      if (!filter.matches(objectToCheck, strictAttributeCase)) {
        return false;
      }
    }

    return true;
  }

  public toString(): string {
    let result: string = '(&';
    for (const filter of this.filters) {
      result += filter.toString();
    }
    result += ')';

    return result;
  }
}

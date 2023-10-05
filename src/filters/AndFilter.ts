import type { BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface AndFilterOptions {
  filters: Filter[];
}

export class AndFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.and;

  public filters: Filter[];

  public constructor(options: AndFilterOptions) {
    super();
    this.filters = options.filters;
  }

  public override writeFilter(writer: BerWriter): void {
    for (const filter of this.filters) {
      filter.write(writer);
    }
  }

  public override matches(objectToCheck: Record<string, string> = {}, strictAttributeCase?: boolean): boolean {
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

  public override toString(): string {
    let result = '(&';
    for (const filter of this.filters) {
      result += filter.toString();
    }

    result += ')';

    return result;
  }
}

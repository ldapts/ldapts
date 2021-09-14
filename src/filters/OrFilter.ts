import type { BerWriter } from 'asn1';

import { SearchFilter } from '../SearchFilter';

import { Filter } from './Filter';

export interface OrFilterOptions {
  filters: Filter[];
}

export class OrFilter extends Filter {
  public type: SearchFilter = SearchFilter.or;

  public filters: Filter[];

  public constructor(options: OrFilterOptions) {
    super();
    this.filters = options.filters;
  }

  public override writeFilter(writer: BerWriter): void {
    for (const filter of this.filters) {
      filter.write(writer);
    }
  }

  public override matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
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

  public override toString(): string {
    let result = '(|';
    for (const filter of this.filters) {
      result += filter.toString();
    }

    result += ')';

    return result;
  }
}

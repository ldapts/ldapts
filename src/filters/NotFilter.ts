import type { BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface NotFilterOptions {
  filter: Filter;
}

export class NotFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.not;

  public filter: Filter;

  public constructor(options: NotFilterOptions) {
    super();
    this.filter = options.filter;
  }

  public override writeFilter(writer: BerWriter): void {
    this.filter.write(writer);
  }

  public override matches(objectToCheck: Record<string, string> = {}, strictAttributeCase?: boolean): boolean {
    return !this.filter.matches(objectToCheck, strictAttributeCase);
  }

  public override toString(): string {
    return `(!${this.filter.toString()})`;
  }
}

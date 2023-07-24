import type { BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter';
import { SearchFilter } from '../SearchFilter';

import { Filter } from './Filter';

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
    return `(!${this.filter.constructor.name})`;
  }
}

import type { BerReader, BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface GreaterThanEqualsFilterOptions {
  attribute?: string;
  value?: string;
}

export class GreaterThanEqualsFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.greaterOrEqual;

  public attribute: string;

  public value: string;

  public constructor(options: GreaterThanEqualsFilterOptions = {}) {
    super();

    this.attribute = options.attribute ?? '';
    this.value = options.value ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    this.attribute = reader.readString()?.toLowerCase() ?? '';
    this.value = reader.readString() ?? '';
  }

  public override writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.writeString(this.value);
  }

  public override matches(objectToCheck: Record<string, string> = {}, strictAttributeCase?: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    if (typeof objectToCheckValue !== 'undefined') {
      if (strictAttributeCase) {
        return objectToCheckValue >= this.value;
      }

      return objectToCheckValue.toLowerCase() >= this.value.toLowerCase();
    }

    return false;
  }

  public override toString(): string {
    return `(${this.escape(this.attribute)}>=${this.escape(this.value)})`;
  }
}

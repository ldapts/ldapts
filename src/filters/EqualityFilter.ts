import { type BerReader, type BerWriter } from '../ber/index.js';
import { Ber } from '../ber/index.js';
import { type SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface EqualityFilterOptions {
  attribute?: string;
  value?: Buffer | string;
}

export class EqualityFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.equalityMatch;

  public attribute: string;

  public value: Buffer | string;

  public constructor(options: EqualityFilterOptions = {}) {
    super();

    this.attribute = options.attribute ?? '';
    this.value = options.value ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    this.attribute = (reader.readString() ?? '').toLowerCase();
    this.value = Filter.readValue(reader);

    if (this.attribute === 'objectclass' && typeof this.value === 'string') {
      this.value = this.value.toLowerCase();
    }
  }

  public override writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    if (Buffer.isBuffer(this.value)) {
      writer.writeBuffer(this.value, Ber.OctetString);
    } else {
      writer.writeString(this.value);
    }
  }

  public override matches(objectToCheck: Record<string, string> = {}, strictAttributeCase?: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    if (typeof objectToCheckValue !== 'undefined') {
      const stringValue = Buffer.isBuffer(this.value) ? this.value.toString('utf8') : this.value;

      if (strictAttributeCase) {
        return stringValue === objectToCheckValue;
      }

      return stringValue.toLowerCase() === objectToCheckValue.toLowerCase();
    }

    return false;
  }

  public override toString(): string {
    return `(${Filter.escape(this.attribute)}=${Filter.escape(this.value)})`;
  }
}

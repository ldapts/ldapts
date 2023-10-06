import type { BerReader, BerWriter } from 'asn1';
import asn1 from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

const { Ber } = asn1;

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
    this.value = reader.readString() ?? '';

    if (this.attribute === 'objectclass') {
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
      if (Buffer.isBuffer(this.value) && Buffer.isBuffer(objectToCheckValue)) {
        return this.value === objectToCheckValue;
      }

      const stringValue = Buffer.isBuffer(this.value) ? this.value.toString('utf8') : this.value;

      if (strictAttributeCase) {
        return stringValue === objectToCheckValue;
      }

      return stringValue.toLowerCase() === objectToCheckValue.toLowerCase();
    }

    return false;
  }

  public override toString(): string {
    return `(${this.escape(this.attribute)}=${this.escape(this.value)})`;
  }
}

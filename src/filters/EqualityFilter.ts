// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface EqualityFilterOptions {
  attribute?: string;
  value?: string;
}

export class EqualityFilter extends Filter {
  public type: SearchFilter = SearchFilter.equalityMatch;
  public attribute: string;
  public value: string;

  constructor(options: EqualityFilterOptions = {}) {
    super();

    this.attribute = options.attribute || '';
    this.value = options.value || '';
  }

  public parseFilter(reader: BerReader): void {
    this.attribute = (reader.readString() || '').toLowerCase();
    this.value = reader.readString(Ber.OctetString, true);

    if (this.attribute === 'objectclass') {
      this.value = this.value.toLowerCase();
    }
  }

  public writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.writeString(this.value, Ber.OctetString);
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    if (typeof objectToCheckValue !== 'undefined') {
      if (strictAttributeCase) {
        return this.value === objectToCheckValue;
      }

      return this.value.toLowerCase() === objectToCheckValue.toLowerCase();
    }

    return false;
  }

  public toString(): string {
    return (`(${this.escape(this.attribute)}=${this.escape(this.value)})`);
  }
}

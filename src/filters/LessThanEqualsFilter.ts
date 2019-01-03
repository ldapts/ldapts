import { BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface LessThanEqualsFilterOptions {
  attribute?: string;
  value?: string;
}

export class LessThanEqualsFilter extends Filter {
  public type: SearchFilter = SearchFilter.lessOrEqual;
  public attribute: string;
  public value: string;

  constructor(options: LessThanEqualsFilterOptions = {}) {
    super();

    this.attribute = options.attribute || '';
    this.value = options.value || '';
  }

  public parseFilter(reader: BerReader): void {
    this.attribute = reader.readString().toLowerCase();
    this.value = reader.readString();
  }

  public writeFilter(writer: BerWriter): void {
    writer.writeString(this.escape(this.attribute));
    writer.writeString(this.escape(this.value));
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    if (typeof objectToCheckValue !== 'undefined') {
      if (strictAttributeCase) {
        return objectToCheckValue <= this.value;
      }

      return objectToCheckValue.toLowerCase() <= this.value.toLowerCase();
    }

    return false;
  }

  public toString(): string {
    return `(${this.escape(this.attribute)}<=${this.escape(this.value)})`;
  }
}

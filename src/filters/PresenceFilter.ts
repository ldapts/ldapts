import { BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface PresenceFilterOptions {
  attribute?: string;
}

export class PresenceFilter extends Filter {
  public type: SearchFilter = SearchFilter.present;
  public attribute: string;

  constructor(options: PresenceFilterOptions = {}) {
    super();
    this.attribute = options.attribute || '';
  }

  public parseFilter(reader: BerReader): void {
    this.attribute = reader.buffer.slice(0, reader.length).toString('utf8').toLowerCase();
    reader._offset += reader.length;
  }

  public writeFilter(writer: BerWriter): void {
    const escapedAttribute = this.escape(this.attribute);
    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < escapedAttribute.length; i++) {
      writer.writeByte(escapedAttribute.charCodeAt(i));
    }
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    return typeof objectToCheckValue !== 'undefined';
  }

  public toString(): string {
    return `(${this.escape(this.attribute)}=*)`;
  }
}

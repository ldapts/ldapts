// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

export interface ApproximateFilterOptions {
  attribute?: string;
  value?: string;
}

export class ApproximateFilter extends Filter {
  public type: SearchFilter = SearchFilter.approxMatch;
  public attribute: string;
  public value: string;

  constructor(options: ApproximateFilterOptions = {}) {
    super();
    this.attribute = options.attribute || '';
    this.value = options.value || '';
  }

  public parseFilter(reader: BerReader): void {
    this.attribute = (reader.readString() || '').toLowerCase();
    this.value = reader.readString();
  }

  public writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.writeString(this.value);
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): void {
    throw new Error(`Approximate match implementation unknown`);
  }

  public toString(): string {
    return (`(${this.escape(this.attribute)}~=${this.escape(this.value)})`);
  }
}

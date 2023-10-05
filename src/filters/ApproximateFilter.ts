import type { BerReader, BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface ApproximateFilterOptions {
  attribute?: string;
  value?: string;
}

export class ApproximateFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.approxMatch;

  public attribute: string;

  public value: string;

  public constructor(options: ApproximateFilterOptions = {}) {
    super();
    this.attribute = options.attribute ?? '';
    this.value = options.value ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    this.attribute = (reader.readString() ?? '').toLowerCase();
    this.value = reader.readString() ?? '';
  }

  public override writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.writeString(this.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override matches(_: Record<string, string> = {}, __?: boolean): boolean {
    throw new Error('Approximate match implementation unknown');
  }

  public override toString(): string {
    return `(${this.escape(this.attribute)}~=${this.escape(this.value)})`;
  }
}

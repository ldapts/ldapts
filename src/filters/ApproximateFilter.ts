import { type BerReader, type BerWriter } from '../ber/index.js';
import { Ber } from '../ber/index.js';
import { type SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface ApproximateFilterOptions {
  attribute?: string;
  value?: Buffer | string;
}

export class ApproximateFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.approxMatch;

  public attribute: string;

  public value: Buffer | string;

  public constructor(options: ApproximateFilterOptions = {}) {
    super();
    this.attribute = options.attribute ?? '';
    this.value = options.value ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    this.attribute = (reader.readString() ?? '').toLowerCase();
    this.value = Filter.readValue(reader);
  }

  public override writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    if (Buffer.isBuffer(this.value)) {
      writer.writeBuffer(this.value, Ber.OctetString);
    } else {
      writer.writeString(this.value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override matches(_: Record<string, string> = {}, __?: boolean): boolean {
    throw new Error('Approximate match implementation unknown');
  }

  public override toString(): string {
    return `(${Filter.escape(this.attribute)}~=${Filter.escape(this.value)})`;
  }
}

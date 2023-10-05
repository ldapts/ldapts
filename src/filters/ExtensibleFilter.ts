import type { BerReader, BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface ExtensibleFilterOptions {
  rule?: string;
  matchType?: string;
  value?: string;
  dnAttributes?: boolean;
  initial?: string;
  any?: string[];
  final?: string;
}

export class ExtensibleFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.extensibleMatch;

  public value: string;

  public rule: string;

  public matchType: string;

  public dnAttributes: boolean;

  public constructor(options: ExtensibleFilterOptions = {}) {
    super();

    this.matchType = options.matchType ?? '';
    this.rule = options.rule ?? '';
    this.dnAttributes = options.dnAttributes === true;
    this.value = options.value ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const tag: number | null = reader.peek();

      switch (tag) {
        case 0x81:
          this.rule = reader.readString(tag) ?? '';
          break;
        case 0x82:
          this.matchType = reader.readString(tag) ?? '';
          break;
        case 0x83:
          this.value = reader.readString(tag) ?? '';
          break;
        case 0x84:
          this.dnAttributes = reader.readBoolean() ?? false;
          break;
        default: {
          let type = '<null>';
          if (tag) {
            type = `0x${tag.toString(16)}`;
          }

          throw new Error(`Invalid ext_match filter type: ${type}`);
        }
      }
    }
  }

  public override writeFilter(writer: BerWriter): void {
    if (this.rule) {
      writer.writeString(this.rule, 0x81);
    }

    if (this.matchType) {
      writer.writeString(this.matchType, 0x82);
    }

    writer.writeString(this.value, 0x83);

    if (this.dnAttributes) {
      writer.writeBoolean(this.dnAttributes, 0x84);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override matches(_: Record<string, string> = {}, __?: boolean): boolean {
    throw new Error('Approximate match implementation unknown');
  }

  public override toString(): string {
    let result = `(${this.escape(this.matchType)}:`;

    if (this.dnAttributes) {
      result += 'dn:';
    }

    if (this.rule) {
      result += `${this.escape(this.rule)}:`;
    }

    result += `=${this.escape(this.value)})`;

    return result;
  }
}

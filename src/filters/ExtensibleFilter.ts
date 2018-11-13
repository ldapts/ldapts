// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { SearchFilter } from '../SearchFilter';

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
  public type: SearchFilter = SearchFilter.extensibleMatch;
  public value: string;
  public rule: string;
  public matchType: string;
  public dnAttributes: boolean;

  constructor(options: ExtensibleFilterOptions = {}) {
    super();

    this.matchType = options.matchType || '';
    this.rule = options.rule || '';
    this.dnAttributes = options.dnAttributes === true;
    this.value = options.value || '';
  }

  public parseFilter(reader: BerReader): void {
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const tag: number = reader.peek();
      switch (tag) {
        case 0x81:
          this.rule = reader.readString(tag);
          break;
        case 0x82:
          this.matchType = reader.readString(tag);
          break;
        case 0x83:
          this.value = reader.readString(tag);
          break;
        case 0x84:
          this.dnAttributes = reader.readBoolean(tag);
          break;
        default:
          throw new Error(`Invalid ext_match filter type: 0x${tag.toString(16)}`);
      }
    }
  }

  public writeFilter(writer: BerWriter): void {
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

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): void {
    throw new Error(`Approximate match implementation unknown`);
  }

  public toString(): string {
    let result: string = `(${this.escape(this.matchType)}:`;

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

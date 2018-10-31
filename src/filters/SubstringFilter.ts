// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Filter } from './Filter';
import { ProtocolOperation } from '../ProtocolOperation';

export interface SubstringFilterOptions {
  attribute?: string;
  initial?: string;
  any?: string[];
  final?: string;
}

export class SubstringFilter extends Filter {

  private static _escapeRegExp(str: string): string {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }
  public type: ProtocolOperation = ProtocolOperation.FILTER_PRESENT;
  public attribute: string;
  public initial: string;
  public any: string[];
  public final: string;

  constructor(options: SubstringFilterOptions = {}) {
    super();
    this.attribute = options.attribute || '';
    this.initial = options.initial || '';
    this.any = options.any || [];
    this.final = options.final || '';
  }

  public parseFilter(reader: BerReader): void {
    this.attribute = reader.readString().toLowerCase();
    reader.readSequence();
    const end = reader.offset + reader.length;

    while (reader.offset < end) {
      const tag: number = reader.peek();
      switch (tag) {
        case 0x80:
          this.initial = reader.readString(tag);
          if (this.attribute === 'objectclass') {
            this.initial = this.initial.toLowerCase();
          }

          break;
        case 0x81:
          let anyValue: string = reader.readString(tag);
          if (this.attribute === 'objectclass') {
            anyValue = anyValue.toLowerCase();
          }

          this.any.push(anyValue);
          break;
        case 0x82:
          this.final = reader.readString(tag);
          if (this.attribute === 'objectclass') {
            this.final = this.final.toLowerCase();
          }
          break;
        default:
          throw new Error(`Invalid substring filter type: 0x${tag.toString(16)}`);
      }
    }
  }

  public writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.startSequence();
    if (this.initial) {
      writer.writeString(this.initial, 0x80);
    }

    if (this.any && this.any.length) {
      for (const anyItem of this.any) {
        writer.writeString(anyItem, 0x81);
      }
    }

    if (this.final) {
      writer.writeString(this.final, 0x82);
    }

    writer.endSequence();
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean {
    const objectToCheckValue = this.getObjectValue(objectToCheck, this.attribute, strictAttributeCase);

    if (typeof objectToCheckValue !== 'undefined') {
      let regexp = '';
      if (this.initial) {
        regexp += `^${SubstringFilter._escapeRegExp(this.initial)}.*`;
      }

      for (const anyItem of this.any) {
        regexp += `${SubstringFilter._escapeRegExp(anyItem)}.*`;
      }

      if (this.final) {
        regexp += `${SubstringFilter._escapeRegExp(this.final)}$`;
      }

      const matcher = new RegExp(regexp, strictAttributeCase ? 'gmu' : 'igmu');
      return matcher.test(objectToCheckValue);
    }

    return false;
  }

  public toString(): string {
    let result = `(${this.escape(this.attribute)}=${this.escape(this.initial)}*`;

    for (const anyItem of this.any) {
      result += `${this.escape(anyItem)}*`;
    }

    result += `${this.escape(this.final)})`;

    return result;
  }
}

import type { BerReader, BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';
import { SearchFilter } from '../SearchFilter.js';

import { Filter } from './Filter.js';

export interface SubstringFilterOptions {
  attribute?: string;
  initial?: string;
  any?: string[];
  final?: string;
}

export class SubstringFilter extends Filter {
  public type: SearchFilterValues = SearchFilter.substrings;

  public attribute: string;

  public initial: string;

  public any: string[];

  public final: string;

  public constructor(options: SubstringFilterOptions = {}) {
    super();
    this.attribute = options.attribute ?? '';
    this.initial = options.initial ?? '';
    this.any = options.any ?? [];
    this.final = options.final ?? '';
  }

  public override parseFilter(reader: BerReader): void {
    this.attribute = reader.readString()?.toLowerCase() ?? '';
    reader.readSequence();
    const end = reader.offset + reader.length;

    while (reader.offset < end) {
      const tag: number | null = reader.peek();

      switch (tag) {
        case 0x80:
          this.initial = reader.readString(tag) ?? '';
          if (this.attribute === 'objectclass') {
            this.initial = this.initial.toLowerCase();
          }

          break;
        case 0x81: {
          let anyValue: string = reader.readString(tag) ?? '';
          if (this.attribute === 'objectclass') {
            anyValue = anyValue.toLowerCase();
          }

          this.any.push(anyValue);
          break;
        }

        case 0x82:
          this.final = reader.readString(tag) ?? '';
          if (this.attribute === 'objectclass') {
            this.final = this.final.toLowerCase();
          }

          break;
        default: {
          let type = '<null>';
          if (tag) {
            type = `0x${tag.toString(16)}`;
          }

          throw new Error(`Invalid substring filter type: ${type}`);
        }
      }
    }
  }

  public override writeFilter(writer: BerWriter): void {
    writer.writeString(this.attribute);
    writer.startSequence();
    if (this.initial) {
      writer.writeString(this.initial, 0x80);
    }

    for (const anyItem of this.any) {
      writer.writeString(anyItem, 0x81);
    }

    if (this.final) {
      writer.writeString(this.final, 0x82);
    }

    writer.endSequence();
  }

  public override matches(objectToCheck: Record<string, string> = {}, strictAttributeCase?: boolean): boolean {
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

      // eslint-disable-next-line security/detect-non-literal-regexp
      const matcher = new RegExp(regexp, strictAttributeCase ? 'gmu' : 'igmu');
      return matcher.test(objectToCheckValue);
    }

    return false;
  }

  public override toString(): string {
    let result = `(${this.escape(this.attribute)}=${this.escape(this.initial)}*`;

    for (const anyItem of this.any) {
      result += `${this.escape(anyItem)}*`;
    }

    result += `${this.escape(this.final)})`;

    return result;
  }

  private static _escapeRegExp(str: string): string {
    return str.replace(/[$()*+./?[\\\]^{|}-]/g, '\\$&');
  }
}

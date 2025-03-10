import type { BerReader, BerWriter } from 'asn1';

import type { SearchFilterValues } from '../SearchFilter.js';

export abstract class Filter {
  public abstract type: SearchFilterValues;

  public write(writer: BerWriter): void {
    writer.startSequence(this.type);
    this.writeFilter(writer);
    writer.endSequence();
  }

  public parse(reader: BerReader): void {
    this.parseFilter(reader);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public matches(_: Record<string, string> = {}, __?: boolean): boolean {
    return true;
  }

  /**
   * RFC 2254 Escaping of filter strings
   * Raw                     Escaped
   * (o=Parens (R Us))       (o=Parens \28R Us\29)
   * (cn=star*)              (cn=star\2A)
   * (filename=C:\MyFile)    (filename=C:\5cMyFile)
   * @param {string|Buffer} input
   * @returns Escaped string
   */
  public escape(input: Buffer | string): string {
    let escapedResult = '';
    if (Buffer.isBuffer(input)) {
      for (const inputChar of input) {
        if (inputChar < 16) {
          escapedResult += `\\0${inputChar.toString(16)}`;
        } else {
          escapedResult += `\\${inputChar.toString(16)}`;
        }
      }
    } else {
      for (const inputChar of input) {
        switch (inputChar) {
          case '*':
            escapedResult += '\\2a';
            break;
          case '(':
            escapedResult += '\\28';
            break;
          case ')':
            escapedResult += '\\29';
            break;
          case '\\':
            escapedResult += '\\5c';
            break;
          case '\0':
            escapedResult += '\\00';
            break;
          default:
            escapedResult += inputChar;
            break;
        }
      }
    }

    return escapedResult;
  }

  public abstract toString(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parseFilter(_: BerReader): void {
    // Do nothing as the default action
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected writeFilter(_: BerWriter): void {
    // Do nothing as the default action
  }

  protected getObjectValue(objectToCheck: Record<string, string>, key: string, strictAttributeCase?: boolean): string | undefined {
    let objectKey;
    if (typeof objectToCheck[key] !== 'undefined') {
      objectKey = key;
    } else if (!strictAttributeCase && key.toLowerCase() === 'objectclass') {
      for (const objectToCheckKey of Object.keys(objectToCheck)) {
        if (objectToCheckKey.toLowerCase() === key.toLowerCase()) {
          objectKey = objectToCheckKey;
          break;
        }
      }
    }

    if (objectKey) {
      return objectToCheck[objectKey];
    }

    return undefined;
  }
}

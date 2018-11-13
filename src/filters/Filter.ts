// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { SearchFilter } from '../SearchFilter';

export abstract class Filter {
  public abstract type: SearchFilter;

  public write(writer: BerWriter): void {
    writer.startSequence(this.type);
    this.writeFilter(writer);
    writer.endSequence();
  }

  public parse(reader: BerReader): void {
    return this.parseFilter(reader);
  }

  public matches(objectToCheck: { [index: string]: string } = {}, strictAttributeCase: boolean): boolean|void {
    return true;
  }

  // tslint:disable-next-line:no-empty
  protected parseFilter(reader: BerReader): void {
  }
  // tslint:disable-next-line:no-empty
  protected writeFilter(writer: BerWriter): void {
  }

  /**
   * RFC 2254 Escaping of filter strings
   *
   * Raw                     Escaped
   * (o=Parens (R Us))       (o=Parens \28R Us\29)
   * (cn=star*)              (cn=star\2A)
   * (filename=C:\MyFile)    (filename=C:\5cMyFile)
   */
  protected escape(input: string|Buffer): string {
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

  protected getObjectValue(objectToCheck: { [index: string]: string } = {}, key: string, strictAttributeCase: boolean): string | undefined {
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

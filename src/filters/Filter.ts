import { TextDecoder } from 'node:util';

import { Ber, type BerReader, type BerWriter } from '../ber/index.js';
import { type SearchFilterValues } from '../SearchFilter.js';

const utf8Decoder = new TextDecoder('utf8', { fatal: true });

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
  public static escape(input: Buffer | string): string {
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

  /**
   * Read an attribute/value assertion value from the wire. The value is returned as a string when
   * it decodes cleanly as UTF-8 and as a Buffer when it does not, so binary assertions (for example
   * an Active Directory `objectGUID`) survive a parse -> write round-trip without being mangled by
   * `toString('utf8')`.
   * @param {BerReader} reader - The reader positioned at the value.
   * @param {number} [tag] - The expected tag of the value; defaults to `Ber.OctetString`.
   * @returns {Buffer|string} The decoded value as a string, or the raw octets as a Buffer when not valid UTF-8.
   */
  protected static readValue(reader: BerReader, tag?: number): Buffer | string {
    const buffer = reader.readString(tag ?? Ber.OctetString, true);
    if (buffer === null) {
      return '';
    }

    try {
      return utf8Decoder.decode(buffer);
    } catch {
      // Not valid UTF-8: keep the octets, mirroring Attribute.parse's binary fallback.
      return buffer;
    }
  }

  protected getObjectValue(objectToCheck: Record<string, string>, key: string, strictAttributeCase?: boolean): string | undefined {
    let objectKey: string | undefined;
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

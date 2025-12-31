/* eslint-disable no-bitwise */
import { Ber } from './Ber.js';
import { InvalidAsn1Error } from './InvalidAsn1Error.js';

export interface BerWriterOptions {
  size?: number;
  growthFactor?: number;
}

export class BerWriter {
  private data: Buffer;
  private size: number;
  private currentOffset = 0;
  private readonly growthFactor: number;
  private readonly sequenceOffsets: number[] = [];

  public constructor(options: BerWriterOptions = {}) {
    const initialSize = options.size ?? 1024;
    this.growthFactor = options.growthFactor ?? 8;
    this.data = Buffer.alloc(initialSize);
    this.size = initialSize;
  }

  public get buffer(): Buffer {
    if (this.sequenceOffsets.length > 0) {
      throw new InvalidAsn1Error(`${this.sequenceOffsets.length} unended sequence(s)`);
    }

    return this.data.subarray(0, this.currentOffset);
  }

  public writeByte(value: number): void {
    this.ensureCapacity(1);
    this.data[this.currentOffset++] = value;
  }

  public writeInt(value: number, tag: number = Ber.Integer): void {
    let intValue = value;
    let byteCount = 4;

    while (((intValue & 0xff800000) === 0 || (intValue & 0xff800000) === 0xff800000 >> 0) && byteCount > 1) {
      byteCount--;
      intValue <<= 8;
    }

    if (byteCount > 4) {
      throw new InvalidAsn1Error('BER integers cannot be > 0xffffffff');
    }

    this.ensureCapacity(2 + byteCount);
    this.data[this.currentOffset++] = tag;
    this.data[this.currentOffset++] = byteCount;

    while (byteCount > 0) {
      byteCount--;
      this.data[this.currentOffset++] = (intValue & 0xff000000) >>> 24;
      intValue <<= 8;
    }
  }

  public writeNull(): void {
    this.writeByte(Ber.Null);
    this.writeByte(0x00);
  }

  public writeEnumeration(value: number, tag: number = Ber.Enumeration): void {
    this.writeInt(value, tag);
  }

  public writeBoolean(value: boolean, tag: number = Ber.Boolean): void {
    this.ensureCapacity(3);
    this.data[this.currentOffset++] = tag;
    this.data[this.currentOffset++] = 0x01;
    this.data[this.currentOffset++] = value ? 0xff : 0x00;
  }

  public writeString(value: string, tag: number = Ber.OctetString): void {
    const byteLength = Buffer.byteLength(value);
    this.writeByte(tag);
    this.writeLength(byteLength);

    if (byteLength > 0) {
      this.ensureCapacity(byteLength);
      this.data.write(value, this.currentOffset);
      this.currentOffset += byteLength;
    }
  }

  public writeBuffer(value: Buffer, tag: number): void {
    this.writeByte(tag);
    this.writeLength(value.length);
    this.ensureCapacity(value.length);
    value.copy(this.data, this.currentOffset, 0, value.length);
    this.currentOffset += value.length;
  }

  public writeStringArray(values: string[]): void {
    for (const value of values) {
      this.writeString(value);
    }
  }

  public writeOID(value: string, tag: number = Ber.OID): void {
    // eslint-disable-next-line security/detect-unsafe-regex
    if (!/^(\d+\.){3,}\d+$/.test(value)) {
      throw new Error('Argument is not a valid OID string');
    }

    const parts = value.split('.');
    const bytes: number[] = [];

    const firstPart = parts[0] ?? '0';
    const secondPart = parts[1] ?? '0';
    bytes.push(Number(firstPart) * 40 + Number(secondPart));

    for (const part of parts.slice(2)) {
      this.encodeOidOctet(bytes, Number(part));
    }

    this.ensureCapacity(2 + bytes.length);
    this.writeByte(tag);
    this.writeLength(bytes.length);

    for (const byte of bytes) {
      this.writeByte(byte);
    }
  }

  public writeLength(length: number): void {
    this.ensureCapacity(4);

    if (length <= 0x7f) {
      this.data[this.currentOffset++] = length;
    } else if (length <= 0xff) {
      this.data[this.currentOffset++] = 0x81;
      this.data[this.currentOffset++] = length;
    } else if (length <= 0xffff) {
      this.data[this.currentOffset++] = 0x82;
      this.data[this.currentOffset++] = length >> 8;
      this.data[this.currentOffset++] = length;
    } else if (length <= 0xffffff) {
      this.data[this.currentOffset++] = 0x83;
      this.data[this.currentOffset++] = length >> 16;
      this.data[this.currentOffset++] = length >> 8;
      this.data[this.currentOffset++] = length;
    } else {
      throw new InvalidAsn1Error('Length too long (> 4 bytes)');
    }
  }

  public startSequence(tag: number = Ber.Sequence | Ber.Constructor): void {
    this.writeByte(tag);
    this.sequenceOffsets.push(this.currentOffset);
    this.ensureCapacity(3);
    this.currentOffset += 3;
  }

  public endSequence(): void {
    const sequenceStart = this.sequenceOffsets.pop();
    if (sequenceStart === undefined) {
      throw new InvalidAsn1Error('No sequence to end');
    }

    const contentStart = sequenceStart + 3;
    const contentLength = this.currentOffset - contentStart;

    if (contentLength <= 0x7f) {
      this.shiftContent(contentStart, contentLength, -2);
      this.data[sequenceStart] = contentLength;
    } else if (contentLength <= 0xff) {
      this.shiftContent(contentStart, contentLength, -1);
      this.data[sequenceStart] = 0x81;
      this.data[sequenceStart + 1] = contentLength;
    } else if (contentLength <= 0xffff) {
      this.data[sequenceStart] = 0x82;
      this.data[sequenceStart + 1] = contentLength >> 8;
      this.data[sequenceStart + 2] = contentLength;
    } else if (contentLength <= 0xffffff) {
      this.shiftContent(contentStart, contentLength, 1);
      this.data[sequenceStart] = 0x83;
      this.data[sequenceStart + 1] = contentLength >> 16;
      this.data[sequenceStart + 2] = contentLength >> 8;
      this.data[sequenceStart + 3] = contentLength;
    } else {
      throw new InvalidAsn1Error('Sequence too long');
    }
  }

  private encodeOidOctet(bytes: number[], octet: number): void {
    if (octet < 128) {
      bytes.push(octet);
    } else if (octet < 16384) {
      bytes.push((octet >>> 7) | 0x80);
      bytes.push(octet & 0x7f);
    } else if (octet < 2097152) {
      bytes.push((octet >>> 14) | 0x80);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    } else if (octet < 268435456) {
      bytes.push((octet >>> 21) | 0x80);
      bytes.push(((octet >>> 14) | 0x80) & 0xff);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    } else {
      bytes.push(((octet >>> 28) | 0x80) & 0xff);
      bytes.push(((octet >>> 21) | 0x80) & 0xff);
      bytes.push(((octet >>> 14) | 0x80) & 0xff);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    }
  }

  private shiftContent(start: number, length: number, shift: number): void {
    this.data.copy(this.data, start + shift, start, start + length);
    this.currentOffset += shift;
  }

  private ensureCapacity(needed: number): void {
    if (this.size - this.currentOffset < needed) {
      let newSize = this.size * this.growthFactor;
      if (newSize - this.currentOffset < needed) {
        newSize += needed;
      }

      const newBuffer = Buffer.alloc(newSize);
      this.data.copy(newBuffer, 0, 0, this.currentOffset);
      this.data = newBuffer;
      this.size = newSize;
    }
  }
}

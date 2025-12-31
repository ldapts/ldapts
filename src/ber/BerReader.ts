/* eslint-disable no-bitwise */
import { Ber } from './Ber.js';
import { InvalidAsn1Error } from './InvalidAsn1Error.js';

export class BerReader {
  private size: number;

  private currentLength = 0;

  private currentOffset = 0;

  public readonly buffer: Buffer;

  public constructor(data: Buffer) {
    if (!Buffer.isBuffer(data)) {
      throw new TypeError('data must be a Buffer');
    }

    this.buffer = data;
    this.size = data.length;
  }

  public get length(): number {
    return this.currentLength;
  }

  public get offset(): number {
    return this.currentOffset;
  }

  public set offset(value: number) {
    this.currentOffset = value;
  }

  public get remain(): number {
    return this.size - this.currentOffset;
  }

  public get remainingBuffer(): Buffer {
    return this.buffer.subarray(this.currentOffset);
  }

  public setBufferSize(size: number): void {
    this.size = size;
  }

  public readByte(peek = false): number | null {
    if (this.size - this.currentOffset < 1) {
      return null;
    }

    const byte = this.buffer.readUInt8(this.currentOffset);

    if (!peek) {
      this.currentOffset += 1;
    }

    return byte;
  }

  public peek(): number | null {
    return this.readByte(true);
  }

  public readLength(startOffset?: number): number | null {
    let offset = startOffset ?? this.currentOffset;

    if (offset >= this.size) {
      return null;
    }

    const lengthByte = this.buffer.readUInt8(offset);
    offset += 1;

    if ((lengthByte & 0x80) === 0x80) {
      const numLengthBytes = lengthByte & 0x7f;

      if (numLengthBytes === 0) {
        throw new InvalidAsn1Error('Indefinite length not supported');
      }

      if (numLengthBytes > 4) {
        throw new InvalidAsn1Error('Encoding too long');
      }

      if (this.size - offset < numLengthBytes) {
        return null;
      }

      this.currentLength = 0;
      for (let i = 0; i < numLengthBytes; i++) {
        this.currentLength = (this.currentLength << 8) + this.buffer.readUInt8(offset);
        offset += 1;
      }
    } else {
      this.currentLength = lengthByte;
    }

    return offset;
  }

  public readSequence(expectedTag?: number): number | null {
    const tag = this.peek();
    if (tag === null) {
      return null;
    }

    if (expectedTag !== undefined && expectedTag !== tag) {
      throw new InvalidAsn1Error(`Expected 0x${expectedTag.toString(16)}: got 0x${tag.toString(16)}`);
    }

    const newOffset = this.readLength(this.currentOffset + 1);
    if (newOffset === null) {
      return null;
    }

    this.currentOffset = newOffset;
    return tag;
  }

  public readInt(): number | null {
    return this.readTag(Ber.Integer);
  }

  public readBoolean(): boolean | null {
    const value = this.readTag(Ber.Boolean);
    if (value === null) {
      return null;
    }

    return value !== 0;
  }

  public readEnumeration(): number | null {
    return this.readTag(Ber.Enumeration);
  }

  public readString(tag?: number, asBuffer?: false): string | null;
  public readString(tag: number, asBuffer: true): Buffer | null;
  public readString(tag: number = Ber.OctetString, asBuffer = false): Buffer | string | null {
    const currentTag = this.peek();
    if (currentTag === null) {
      return null;
    }

    if (currentTag !== tag) {
      throw new InvalidAsn1Error(`Expected 0x${tag.toString(16)}: got 0x${currentTag.toString(16)}`);
    }

    const newOffset = this.readLength(this.currentOffset + 1);
    if (newOffset === null) {
      return null;
    }

    if (this.currentLength > this.size - newOffset) {
      return null;
    }

    this.currentOffset = newOffset;

    if (this.currentLength === 0) {
      return asBuffer ? Buffer.alloc(0) : '';
    }

    const value = this.buffer.subarray(this.currentOffset, this.currentOffset + this.currentLength);
    this.currentOffset += this.currentLength;

    return asBuffer ? value : value.toString('utf8');
  }

  public readOID(tag: number = Ber.OID): string | null {
    const data = this.readString(tag, true);
    if (data === null) {
      return null;
    }

    const values: number[] = [];
    let value = 0;

    for (const byte of data) {
      value = (value << 7) + (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        values.push(value);
        value = 0;
      }
    }

    const firstValue = values[0] ?? 0;
    return [Math.trunc(firstValue / 40), firstValue % 40, ...values.slice(1)].join('.');
  }

  public readTag(tag: number): number | null {
    const currentTag = this.peek();

    if (currentTag === null) {
      return null;
    }

    if (currentTag !== tag) {
      throw new InvalidAsn1Error(`Expected 0x${tag.toString(16)}: got 0x${currentTag.toString(16)}`);
    }

    const newOffset = this.readLength(this.currentOffset + 1);
    if (newOffset === null) {
      return null;
    }

    if (this.currentLength > 4) {
      throw new InvalidAsn1Error(`Integer too long: ${this.currentLength}`);
    }

    if (this.currentLength > this.size - newOffset) {
      return null;
    }

    this.currentOffset = newOffset;

    const firstByte = this.buffer.readUInt8(this.currentOffset);
    let value = 0;

    for (let i = 0; i < this.currentLength; i++) {
      value = (value << 8) | this.buffer.readUInt8(this.currentOffset);
      this.currentOffset += 1;
    }

    if ((firstByte & 0x80) === 0x80 && this.currentLength < 4) {
      value -= 1 << (this.currentLength * 8);
    }

    return value >> 0;
  }
}

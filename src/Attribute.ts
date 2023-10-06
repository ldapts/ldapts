import type { BerReader, BerWriter } from 'asn1';
import asn1 from 'asn1';

import { ProtocolOperation } from './ProtocolOperation.js';

const { Ber } = asn1;

export interface AttributeOptions {
  type?: string;
  values?: Buffer[] | string[];
}

export class Attribute {
  private buffers: Buffer[] = [];

  public type: string;

  public values: Buffer[] | string[];

  public constructor(options: AttributeOptions = {}) {
    this.type = options.type ?? '';
    this.values = options.values ?? [];
  }

  public get parsedBuffers(): Buffer[] {
    return this.buffers;
  }

  public write(writer: BerWriter): void {
    writer.startSequence();
    const { type } = this;

    writer.writeString(type);
    writer.startSequence(ProtocolOperation.LBER_SET);

    if (this.values.length) {
      for (const value of this.values) {
        if (Buffer.isBuffer(value)) {
          writer.writeBuffer(value, Ber.OctetString);
        } else {
          writer.writeString(value);
        }
      }
    } else {
      writer.writeStringArray([]);
    }

    writer.endSequence();
    writer.endSequence();
  }

  public parse(reader: BerReader): void {
    reader.readSequence();

    this.type = reader.readString() ?? '';
    const isBinaryType = this._isBinaryType();

    if (reader.peek() === ProtocolOperation.LBER_SET) {
      if (reader.readSequence(ProtocolOperation.LBER_SET)) {
        const end = reader.offset + reader.length;
        while (reader.offset < end) {
          const buffer = reader.readString(Ber.OctetString, true) ?? Buffer.alloc(0);
          this.buffers.push(buffer);
          if (isBinaryType) {
            (this.values as Buffer[]).push(buffer);
          } else {
            (this.values as string[]).push(buffer.toString('utf8'));
          }
        }
      }
    }
  }

  private _isBinaryType(): boolean {
    return /;binary$/i.test(this.type || '');
  }
}

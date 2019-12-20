import { Ber, BerReader, BerWriter } from 'asn1';
import { ProtocolOperation } from './ProtocolOperation';

export interface AttributeOptions {
  type?: string;
  values?: string[] | Buffer[];
}

export class Attribute {
  public type: string;

  public values: string[] | Buffer[];

  public constructor(options: AttributeOptions = {}) {
    this.type = options.type || '';
    this.values = options.values || [];
  }

  public write(writer: BerWriter): void {
    writer.startSequence();
    let { type } = this;
    const isBinaryType = this._isBinaryType();
    // If the value is a buffer and the type does not end in ;binary, append it
    if (!isBinaryType && this.values.length && Buffer.isBuffer(this.values[0])) {
      type += ';binary';
    }

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

  public parse(reader: BerReader) {
    reader.readSequence();

    this.type = reader.readString();
    const isBinaryType = this._isBinaryType();

    if (reader.peek() === ProtocolOperation.LBER_SET) {
      if (reader.readSequence(ProtocolOperation.LBER_SET)) {
        const end = reader.offset + reader.length;
        while (reader.offset < end) {
          if (isBinaryType) {
            (this.values as Buffer[]).push(reader.readString(Ber.OctetString, true) || Buffer.alloc(0));
          } else {
            (this.values as string[]).push(reader.readString());
          }
        }
      }
    }
  }

  private _isBinaryType() {
    return /;binary$/i.test(this.type || '');
  }
}

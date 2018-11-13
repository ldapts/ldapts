// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { ProtocolOperation } from './ProtocolOperation';

export interface AttributeOptions {
  type?: string;
  values?: string[];
}

export class Attribute {
  public type: string;
  public values: string[];

  constructor(options: AttributeOptions = {}) {
    this.type = options.type || '';
    this.values = options.values || [];
  }

  public write(writer: BerWriter): void {
    writer.startSequence();
    writer.writeString(this.type);
    writer.startSequence(ProtocolOperation.LBER_SET);

    if (this.values.length) {
      for (const value of this.values) {
        writer.writeByte(Ber.OctetString);
        writer.writeLength(value.length);
        for (const valueByte of value) {
          writer.writeByte(valueByte);
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

    if (reader.peek() === ProtocolOperation.LBER_SET) {
      if (reader.readSequence(ProtocolOperation.LBER_SET)) {
        const end = reader.offset + reader.length;
        while (reader.offset < end) {
          this.values.push(reader.readString(Ber.OctetString, true));
        }
      }
    }
  }
}

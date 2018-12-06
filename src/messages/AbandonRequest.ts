import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';
import * as assert from 'assert';

export interface AbandonRequestMessageOptions extends MessageOptions {
  abandonId?: number;
}

export class AbandonRequest extends Message {
  public protocolOperation: ProtocolOperation;
  public abandonId: number;

  constructor(options: AbandonRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_ABANDON;
    this.abandonId = options.abandonId || 0;
  }

  public writeMessage(writer: BerWriter): void {
    // Encode abandon request using different ASN.1 integer logic
    /* tslint:disable:no-bitwise no-increment-decrement */
    let i = this.abandonId;
    let intSize = 4;
    const mask = 0xff800000;

    while ((((i & mask) === 0) || ((i & mask) === mask)) && (intSize > 1)) {
      intSize--;
      i <<= 8;
    }

    assert.ok(intSize <= 4);

    while (intSize-- > 0) {
      writer.writeByte((i & 0xff000000) >> 24);
      i <<= 8;
    }
    /* tslint:enable:no-bitwise no-increment-decrement */
  }

  public parseMessage(reader: BerReader) {
    const length = reader.length;
    // Abandon request messages are encoded using different ASN.1 integer logic, forcing custom decoding logic
    let offset: number = 0;
    let value: number;

    /* tslint:disable:no-bitwise no-increment-decrement */
    const fb = reader.buffer[offset++];
    value = fb & 0x7F;
    for (let i = 1; i < length; i++) {
      value <<= 8;
      value |= (reader.buffer[offset++] & 0xff);
    }
    if ((fb & 0x80) === 0x80) {
      value = -value;
    }

    /* tslint:enable:no-bitwise no-increment-decrement */

    reader._offset += length;

    this.abandonId = value;
  }
}

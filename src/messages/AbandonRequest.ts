import * as assert from 'node:assert';

import type { BerReader, BerWriter } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

export interface AbandonRequestMessageOptions extends MessageOptions {
  abandonId?: number;
}

export class AbandonRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public abandonId: number;

  public constructor(options: AbandonRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_ABANDON;
    this.abandonId = options.abandonId ?? 0;
  }

  /* eslint-disable no-bitwise */
  public override writeMessage(writer: BerWriter): void {
    // Encode abandon request using different ASN.1 integer logic
    let i = this.abandonId;
    let intSize = 4;
    const mask = 0xff800000;

    while (((i & mask) === 0 || (i & mask) === mask) && intSize > 1) {
      intSize -= 1;
      i <<= 8;
    }

    assert.ok(intSize <= 4);

    while (intSize-- > 0) {
      writer.writeByte((i & 0xff000000) >> 24);
      i <<= 8;
    }
  }

  public override parseMessage(reader: BerReader): void {
    const { length } = reader;
    if (length) {
      // Abandon request messages are encoded using different ASN.1 integer logic, forcing custom decoding logic
      let offset = 1;
      let value: number;

      const fb = reader.buffer[offset] ?? 0;
      value = fb & 0x7f;
      for (let i = 1; i < length; i += 1) {
        value <<= 8;
        offset += 1;

        const bufferValue = reader.buffer[offset] ?? 0;
        value |= bufferValue & 0xff;
      }
      if ((fb & 0x80) === 0x80) {
        value = -value;
      }

      reader._offset += length;

      this.abandonId = value;
    } else {
      this.abandonId = 0;
    }
  }
  /* eslint-enable no-bitwise */
}

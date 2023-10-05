import type { BerReader } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';

export class BindResponse extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public data: string[] = [];

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_BIND;
  }

  public override parseMessage(reader: BerReader): void {
    super.parseMessage(reader);
    while (reader.remain > 0) {
      const type = reader.peek();
      if (type === ProtocolOperation.LDAP_CONTROLS) {
        break;
      }

      this.data.push(reader.readString(typeof type === 'number' ? type : undefined) ?? '');
    }
  }
}

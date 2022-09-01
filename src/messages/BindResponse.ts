import type { BerReader } from 'asn1';

import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageResponseOptions } from './MessageResponse';
import { MessageResponse } from './MessageResponse';

export class BindResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public data: string[] = [];

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_BIND;
  }

  public override parseMessage(reader: BerReader): void {
    super.parseMessage(reader);
    while (reader.remain > 0) {
      const type = reader.peek();
      this.data.push(reader.readString(typeof type === 'number' ? type : undefined));
    }
  }
}

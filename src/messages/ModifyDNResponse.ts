import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export class ModifyDNResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_MODRDN;
  }
}

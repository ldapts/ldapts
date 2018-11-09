// @ts-ignore
import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export class ModifyDNResponse extends MessageResponse {
  constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_MODRDN;
  }
}

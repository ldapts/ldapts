import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export class AddResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_ADD;
  }
}

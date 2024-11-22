import type { BerReader, BerWriter } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

export interface ModifyDNRequestMessageOptions extends MessageOptions {
  deleteOldRdn?: boolean;
  dn?: string;
  newRdn?: string;
  newSuperior?: string;
}

export class ModifyDNRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public deleteOldRdn: boolean;

  public dn: string;

  public newRdn: string;

  public newSuperior: string;

  public constructor(options: ModifyDNRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_MODRDN;

    this.deleteOldRdn = options.deleteOldRdn !== false;
    this.dn = options.dn ?? '';
    this.newRdn = options.newRdn ?? '';
    this.newSuperior = options.newSuperior ?? '';
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.writeString(this.newRdn);
    writer.writeBoolean(this.deleteOldRdn);
    if (this.newSuperior) {
      const length = Buffer.byteLength(this.newSuperior);
      writer.writeByte(0x80);
      writer.writeLength(length);
      writer._ensure(length);
      writer._buf.write(this.newSuperior, writer._offset);
      writer._offset += length;
    }
  }

  public override parseMessage(reader: BerReader): void {
    this.dn = reader.readString() ?? '';
    this.newRdn = reader.readString() ?? '';
    this.deleteOldRdn = reader.readBoolean() ?? false;
    if (reader.peek() === 0x80) {
      this.newSuperior = reader.readString(0x80) ?? '';
    }
  }
}

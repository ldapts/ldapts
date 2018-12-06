import { BerReader, BerWriter } from 'asn1';
import { Control } from '../controls/Control';
import { ProtocolOperation } from '../ProtocolOperation';
import { ControlParser } from '../ControlParser';

export interface MessageOptions {
  messageId: number;
  controls?: Control[];
}

export abstract class Message {
  public version: ProtocolOperation = ProtocolOperation.LDAP_VERSION_3;
  public messageId: number = 0;
  public abstract protocolOperation: ProtocolOperation;
  public controls?: Control[];

  protected constructor(options: MessageOptions) {
    this.messageId = options.messageId;
    this.controls = options.controls;
  }

  public write(): Buffer {
    const writer = new BerWriter();
    writer.startSequence();
    writer.writeInt(this.messageId);

    writer.startSequence(this.protocolOperation);
    this.writeMessage(writer);
    writer.endSequence();

    if (this.controls && this.controls.length) {
      writer.startSequence(ProtocolOperation.LDAP_CONTROLS);
      for (const control of this.controls) {
        control.write(writer);
      }
      writer.endSequence();
    }

    writer.endSequence();
    return writer.buffer;
  }

  public parse(reader: BerReader): void {
    this.controls = [];
    this.parseMessage(reader);

    if (reader.peek() === ProtocolOperation.LDAP_CONTROLS) {
      reader.readSequence();
      const end = reader.offset + reader.length;
      while (reader.offset < end) {
        const control = ControlParser.parse(reader);
        if (control) {
          this.controls.push(control);
        }
      }
    }
  }

  public toString(): string {
    return JSON.stringify({
      messageId: this.messageId,
      messageType: this.constructor.name,
    },                    null, 2);
  }

  // tslint:disable-next-line:no-empty
  protected parseMessage(_: BerReader): void {
  }

  // tslint:disable-next-line:no-empty
  protected writeMessage(_: BerWriter): void {
  }
}

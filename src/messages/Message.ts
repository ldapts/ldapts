import type { BerReader, BerWriter as BerWriterType } from 'asn1';
import asn1 from 'asn1';

import { ControlParser } from '../ControlParser.js';
import type { Control } from '../controls/Control.js';
import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

const { BerWriter } = asn1;

export interface MessageOptions {
  messageId: number;
  controls?: Control[];
}

export abstract class Message {
  public version: number = ProtocolOperation.LDAP_VERSION_3;

  public messageId = 0;

  public abstract protocolOperation: ProtocolOperationValues;

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

    if (this.controls?.length) {
      writer.startSequence(ProtocolOperation.LDAP_CONTROLS);
      for (const control of this.controls) {
        control.write(writer);
      }

      writer.endSequence();
    }

    writer.endSequence();
    return writer.buffer;
  }

  public parse(reader: BerReader, requestControls: Control[]): void {
    this.controls = [];
    this.parseMessage(reader);

    if (reader.peek() === ProtocolOperation.LDAP_CONTROLS) {
      reader.readSequence();
      const end = reader.offset + reader.length;
      while (reader.offset < end) {
        const control = ControlParser.parse(reader, requestControls);
        if (control) {
          this.controls.push(control);
        }
      }
    }
  }

  public toString(): string {
    return JSON.stringify(
      {
        messageId: this.messageId,
        messageType: this.constructor.name,
      },
      null,
      2,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parseMessage(_: BerReader): void {
    // Do nothing as the default action
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected writeMessage(_: BerWriterType): void {
    // Do nothing as the default action
  }
}

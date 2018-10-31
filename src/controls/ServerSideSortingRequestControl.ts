// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { Control, ControlOptions } from './Control';

export interface ServerSideSortingRequestValue {
  attributeType: string;
  orderingRule?: string;
  reverseOrder?: boolean;
}

export interface ServerSideSortingRequestControlOptions extends ControlOptions {
  value?: Buffer | ServerSideSortingRequestValue | ServerSideSortingRequestValue[];
}

export class ServerSideSortingRequestControl extends Control {
  public static type: string = '2.16.840.1.113730.3.4.3';
  public type: string = ServerSideSortingRequestControl.type;
  public values?: ServerSideSortingRequestValue[];

  constructor(options: ServerSideSortingRequestControlOptions) {
    super(options);

    if (options.value) {
      if (Buffer.isBuffer(options.value)) {
        this.values = [];
        this.parse(options.value);
      } else if (Array.isArray(options.value)) {
        this.values = options.value;
      } else if (typeof options.value === 'object') {
        this.values = [options.value];
      }
    }
  }

  public parse(buffer: Buffer): void {
    const reader = new BerReader(buffer);
    if (reader.readSequence(0x30)) {
      this.values = [];
      while (reader.readSequence(0x30)) {
        const attributeType: string = reader.readString(Ber.OctetString);
        let orderingRule: string = '';
        let reverseOrder: boolean = false;
        if (reader.peek() === 0x80) {
          orderingRule = reader.readString(0x80);
        }

        if (reader.peek() === 0x81) {
          reverseOrder = reader._readTag(0x81) !== 0;
        }

        this.values.push({
          attributeType,
          orderingRule,
          reverseOrder,
        });
      }
    }
  }

  public writeControl(writer: BerWriter): void {
    if (!this.values || !this.values.length) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence(0x30);
    for (const value of this.values) {
      controlWriter.startSequence(0x30);
      controlWriter.writeString(value.attributeType, Ber.OctetString);

      if (value.orderingRule) {
        controlWriter.writeString(value.orderingRule, 0x80);
      }

      if (typeof value.reverseOrder !== 'undefined') {
        controlWriter.writeString(value.reverseOrder, 0x81);
      }

      controlWriter.endSequence();
    }

    controlWriter.endSequence();
    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}

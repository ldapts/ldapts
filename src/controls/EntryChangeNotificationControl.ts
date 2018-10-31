// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Control, ControlOptions } from './Control';

export interface EntryChangeNotificationControlValue {
  changeType: number;
  previousDN?: string;
  changeNumber: number;
}

export interface EntryChangeNotificationControlOptions extends ControlOptions {
  value?: Buffer | EntryChangeNotificationControlValue;
}

export class EntryChangeNotificationControl extends Control {
  public static type: string = '2.16.840.1.113730.3.4.7';
  public type: string = EntryChangeNotificationControl.type;
  public value?: EntryChangeNotificationControlValue;

  constructor(options: EntryChangeNotificationControlOptions) {
    super(options);

    if (options.value) {
      if (Buffer.isBuffer(options.value)) {
        this.parse(options.value);
      } else if (typeof options.value === 'object') {
        this.value = options.value;
      }
    }
  }

  public parse(buffer: Buffer): void {
    const reader = new BerReader(buffer);
    if (reader.readSequence()) {
      const changeType = reader.readInt();
      let previousDN;

      if (changeType === 8) {
        previousDN = reader.readString();
      }

      const changeNumber = reader.readInt();

      this.value = {
        changeType,
        previousDN,
        changeNumber,
      };
    }
  }

  public writeControl(writer: BerWriter): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.changeType);
    if (this.value.previousDN) {
      controlWriter.writeString(this.value.previousDN);
    }

    controlWriter.writeInt(this.value.changeNumber);
    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}

import { BerReader, BerWriter } from 'asn1';
import { Control, ControlOptions } from './Control';

export interface EntryChangeNotificationControlValue {
  changeType: number;
  previousDN?: string;
  changeNumber: number;
}

export interface EntryChangeNotificationControlOptions extends ControlOptions {
  value?: EntryChangeNotificationControlValue;
}

export class EntryChangeNotificationControl extends Control {
  public static type = '2.16.840.1.113730.3.4.7';

  public type: string = EntryChangeNotificationControl.type;

  public value?: EntryChangeNotificationControlValue;

  public constructor(options: EntryChangeNotificationControlOptions = {}) {
    super(options);

    this.value = options.value;
  }

  public parseControl(reader: BerReader): void {
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

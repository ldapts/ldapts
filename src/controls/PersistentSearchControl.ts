import { BerReader, BerWriter } from 'asn1';
import { Control, ControlOptions } from './Control';

export interface PersistentSearchValue {
  changeTypes: number;
  changesOnly: boolean;
  returnECs: boolean;
}

export interface PersistentSearchControlOptions extends ControlOptions {
  value?: PersistentSearchValue;
}

export class PersistentSearchControl extends Control {
  public static type = '2.16.840.1.113730.3.4.3';

  public type: string = PersistentSearchControl.type;

  public value?: PersistentSearchValue;

  public constructor(options: PersistentSearchControlOptions = {}) {
    super(options);

    this.value = options.value;
  }

  public parseControl(reader: BerReader): void {
    if (reader.readSequence()) {
      const changeTypes = reader.readInt();
      const changesOnly = reader.readBoolean();
      const returnECs = reader.readBoolean();

      this.value = {
        changeTypes,
        changesOnly,
        returnECs,
      };
    }
  }

  public writeControl(writer: BerWriter): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.changeTypes);
    controlWriter.writeBoolean(this.value.changesOnly);
    controlWriter.writeBoolean(this.value.returnECs);
    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}

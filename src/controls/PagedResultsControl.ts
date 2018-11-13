// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { Control, ControlOptions } from './Control';

export interface PagedResultsValue {
  size: number;
  cookie?: string;
}

export interface PagedResultsControlOptions extends ControlOptions {
  value?: Buffer | PagedResultsValue;
}

export class PagedResultsControl extends Control {
  public static type: string = '1.2.840.113556.1.4.319';
  public type: string = PagedResultsControl.type;
  public value?: PagedResultsValue;

  constructor(options: PagedResultsControlOptions) {
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
      const size = reader.readInt();
      const cookie = reader.readString(Ber.OctetString, true) || '';

      this.value = {
        size,
        cookie,
      };
    }
  }

  public writeControl(writer: BerWriter): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.size);
    controlWriter.writeString(this.value.cookie || '');
    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}

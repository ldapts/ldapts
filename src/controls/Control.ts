import type { BerReader, BerWriter } from 'asn1';

export interface ControlOptions {
  critical?: boolean;
}

export class Control {
  public type: string;

  public critical: boolean;

  public constructor(type: string, options: ControlOptions = {}) {
    this.type = type;
    this.critical = options.critical === true;
  }

  public write(writer: BerWriter): void {
    writer.startSequence();
    writer.writeString(this.type);
    writer.writeBoolean(this.critical);
    this.writeControl(writer);
    writer.endSequence();
  }

  public parse(reader: BerReader): void {
    this.parseControl(reader);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected writeControl(_: BerWriter): void {
    // Do nothing as the default action
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parseControl(_: BerReader): void {
    // Do nothing as the default action
  }
}

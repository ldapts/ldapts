import { type BerReader, type BerWriter } from '../ber/index.js';

export interface ControlOptions {
  critical?: boolean;
  /**
   * OID the server uses for this control's response when it differs from the request OID. Defaults to `type`.
   */
  responseType?: string;
}

export class Control {
  public type: string;

  public critical: boolean;

  public responseType: string;

  public constructor(type: string, options: ControlOptions = {}) {
    this.type = type;
    this.critical = options.critical === true;
    this.responseType = options.responseType ?? type;
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

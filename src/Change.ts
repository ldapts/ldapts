import type { BerReader, BerWriter } from 'asn1';

import { Attribute } from './Attribute.js';

export interface ChangeOptions {
  operation?: 'add' | 'delete' | 'replace';
  modification: Attribute;
}

export class Change {
  public operation: 'add' | 'delete' | 'replace';

  public modification: Attribute;

  public constructor(
    options: ChangeOptions = {
      modification: new Attribute(),
    },
  ) {
    this.operation = options.operation ?? 'add';
    this.modification = options.modification;
  }

  public write(writer: BerWriter): void {
    writer.startSequence();

    switch (this.operation) {
      case 'add':
        writer.writeEnumeration(0x00);
        break;
      case 'delete':
        writer.writeEnumeration(0x01);
        break;
      case 'replace':
        writer.writeEnumeration(0x02);
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Unknown change operation: ${this.operation}`);
    }

    this.modification.write(writer);

    writer.endSequence();
  }

  public parse(reader: BerReader): void {
    reader.readSequence();

    const operation = reader.readEnumeration();

    switch (operation) {
      case 0x00:
        this.operation = 'add';
        break;
      case 0x01:
        this.operation = 'delete';
        break;
      case 0x02:
        this.operation = 'replace';
        break;
      case null:
        throw new Error(`Unknown change operation - <null> operation value`);
      default:
        throw new Error(`Unknown change operation: 0x${operation.toString(16)}`);
    }

    this.modification = new Attribute();
    this.modification.parse(reader);
  }
}

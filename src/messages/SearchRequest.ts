// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';
import { PresenceFilter } from '../filters/PresenceFilter';
import { FilterParser } from '../FilterParser';
import { Filter } from '../filters/Filter';
import { SearchOptions } from '../Client';

export interface SearchRequestMessageOptions extends MessageOptions, SearchOptions {
  baseDN?: string;
}

export class SearchRequest extends Message {
  public baseDN: string;
  public scope: 'base' | 'one' | 'sub' | 'children';
  public derefAliases: 'never' | 'always' | 'search' | 'find';
  public sizeLimit: number;
  public timeLimit: number;
  public returnAttributeValues: boolean;
  public filter: string | Filter;
  public attributes: string[];

  constructor(options: SearchRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_SEARCH;

    this.baseDN = options.baseDN || '';
    this.scope = options.scope || 'sub';
    this.derefAliases = options.derefAliases || 'never';
    this.sizeLimit = options.sizeLimit || 0;
    this.timeLimit = options.timeLimit || 10;
    this.returnAttributeValues = options.returnAttributeValues !== false;
    this.filter = options.filter || '';
    this.attributes = options.attributes || [];
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeString(this.baseDN);

    switch (this.scope) {
      case 'base':
        writer.writeEnumeration(0);
        break;
      case 'one':
        writer.writeEnumeration(1);
        break;
      case 'sub':
        writer.writeEnumeration(2);
        break;
      case 'children':
        writer.writeEnumeration(3);
        break;
      default:
        throw new Error(`Invalid search scope: ${this.scope}`);
    }

    switch (this.derefAliases) {
      case 'never':
        writer.writeEnumeration(0);
        break;
      case 'search':
        writer.writeEnumeration(1);
        break;
      case 'find':
        writer.writeEnumeration(2);
        break;
      case 'always':
        writer.writeEnumeration(3);
        break;
      default:
        throw new Error(`Invalid deref alias: ${this.derefAliases}`);
    }

    writer.writeInt(this.sizeLimit);
    writer.writeInt(this.timeLimit);
    writer.writeBoolean(!this.returnAttributeValues);

    if (this.filter && typeof this.filter === 'string') {
      this.filter = FilterParser.parseString(this.filter as string);
    } else if (!this.filter) {
      this.filter = new PresenceFilter({ attribute: 'objectclass' });
    }

    (this.filter as Filter).write(writer);

    // tslint:disable-next-line:no-bitwise
    writer.startSequence(writer.Sequence | writer.Constructor);

    if (this.attributes && this.attributes.length) {
      for (const attribute of this.attributes) {
        writer.writeString(attribute);
      }
    }

    writer.endSequence();
  }

  public parseMessage(reader: BerReader) {
    this.baseDN = reader.readString();
    this.scope = reader.readEnumeration();
    this.derefAliases = reader.readEnumeration();
    this.sizeLimit = reader.readInt();
    this.timeLimit = reader.readInt();
    this.returnAttributeValues = !reader.readBoolean();
    this.filter = FilterParser.parse(reader);

    if (reader.peek() === 0x30) {
      reader.readSequence();
      const end = reader.offset + reader.length;
      while (reader.offset < end) {
        this.attributes.push((reader.readString() || '').toLowerCase());
      }
    }
  }
}

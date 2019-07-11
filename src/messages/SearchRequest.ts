import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';
import { FilterParser } from '../FilterParser';
import { Filter } from '../filters/Filter';
import { SearchOptions } from '../Client';

export interface SearchRequestMessageOptions extends MessageOptions, SearchOptions {
  baseDN?: string;
  filter: Filter;
}

export class SearchRequest extends Message {
  public protocolOperation: ProtocolOperation;
  public baseDN: string;
  public scope: 'base' | 'one' | 'sub' | 'children';
  public derefAliases: 'never' | 'always' | 'search' | 'find';
  public sizeLimit: number;
  public timeLimit: number;
  public returnAttributeValues: boolean;
  public filter: Filter;
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
    this.filter = options.filter;
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

    this.filter.write(writer);

    writer.startSequence();

    if (this.attributes && this.attributes.length) {
      for (const attribute of this.attributes) {
        writer.writeString(attribute);
      }
    }

    writer.endSequence();
  }

  public parseMessage(reader: BerReader) {
    this.baseDN = reader.readString();
    const scope = reader.readEnumeration();
    switch (scope) {
      case 0:
        this.scope = 'base';
        break;
      case 1:
        this.scope = 'one';
        break;
      case 2:
        this.scope = 'sub';
        break;
      case 3:
        this.scope = 'children';
        break;
      default:
        throw new Error(`Invalid search scope: ${scope}`);
    }

    const derefAliases = reader.readEnumeration();
    switch (scope) {
      case 0:
        this.derefAliases = 'never';
        break;
      case 1:
        this.derefAliases = 'search';
        break;
      case 2:
        this.derefAliases = 'find';
        break;
      case 3:
        this.derefAliases = 'always';
        break;
      default:
        throw new Error(`Invalid deref alias: ${derefAliases}`);
    }

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

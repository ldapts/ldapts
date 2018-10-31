// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import * as assert from 'assert';
import StrictEventEmitter from 'strict-event-emitter-types';
import { Message } from './messages/Message';
import EventEmitter = NodeJS.EventEmitter;
import { ProtocolOperation } from './ProtocolOperation';
import { AbandonRequest } from './messages/AbandonRequest';
import { BindRequest } from './messages/BindRequest';
import { UnbindRequest } from './messages/UnbindRequest';
import { CompareRequest } from './messages/CompareRequest';
import { DeleteRequest } from './messages/DeleteRequest';
import { ExtendedRequest } from './messages/ExtendedRequest';
import { ModifyDNRequest } from './messages/ModifyDNRequest';
import { SearchRequest } from './messages/SearchRequest';

type MessageParserEmitter = StrictEventEmitter<EventEmitter, MessageParserEvents>;

interface MessageParserEvents {
  message: (message: Message) => void;
  error: (error: Error) => void;
}

export class MessageParser extends (EventEmitter as { new(): MessageParserEmitter }) {
  private buffer?: Buffer;

  public read(data: Buffer) {
    let nextMessage;

    if (this.buffer) {
      this.buffer = Buffer.concat([this.buffer, data]);
    } else {
      this.buffer = data;
    }

    const reader = new BerReader(this.buffer);
    let foundSequence = false;
    try {
      foundSequence = reader.readSequence();
    } catch (ex) {
      this.emit('error', ex);
    }

    if (!foundSequence || reader.remain < reader.length) {
      // Have not received enough data to successfully parse
      return false;
    }

    if (reader.remain > reader.length) {
      // Received too much data
      nextMessage = this.buffer.slice(reader.offset + reader.length);
      reader._size = reader.offset + reader.length;
      assert.strictEqual(reader.remain, reader.length);
    }

    // Free up space since `ber` holds the current message and `nextMessage` is temporarily pointing
    // at the next sequence of data (if it exists)
    delete this.buffer;

    try {
      const message = this._getMessageFromProtocolOperation(reader);

      if (message) {
        this.emit('message', message);
      }
    } catch (ex) {
      this.emit('error', ex);
      return;
    }

    if (nextMessage) {
      this.read(nextMessage);
    }
  }

  private _getMessageFromProtocolOperation(reader: BerReader): Message {
    const messageId = reader.readInt();
    const protocolOperation: ProtocolOperation = reader.readSequence();

    let message: Message;
    switch (protocolOperation) {
      case ProtocolOperation.LDAP_REQ_ABANDON:
        message = new AbandonRequest({
          messageId,
        });
        break;
      // case ProtocolOperation.LDAP_REQ_ADD:
      //   message = new AddRequest({
      //     messageId,
      //   });
      //   break;
      case ProtocolOperation.LDAP_REQ_BIND:
        message = new BindRequest({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_REQ_COMPARE:
        message = new CompareRequest({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_REQ_DELETE:
        message = new DeleteRequest({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_REQ_EXTENSION:
        message = new ExtendedRequest({
          messageId,
        });
        break;
      // case ProtocolOperation.LDAP_REQ_MODIFY:
      //   message = new ModifyRequest({
      //     messageId,
      //   });
      //   break;
      case ProtocolOperation.LDAP_REQ_MODRDN:
        message = new ModifyDNRequest({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_REQ_SEARCH:
        message = new SearchRequest({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_REQ_UNBIND:
        message = new UnbindRequest({
          messageId,
        });
        break;
      default:
        throw new Error(`Protocol Operation not supported: 0x${protocolOperation.toString(16)}`);
    }

    message.parse(reader);
    return message;
  }
}

// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import * as assert from 'assert';
import StrictEventEmitter from 'strict-event-emitter-types';
import { EventEmitter } from 'events';
import { ProtocolOperation } from './ProtocolOperation';
import { BindResponse } from './messages/BindResponse';
import { CompareResponse } from './messages/CompareResponse';
import { DeleteResponse } from './messages/DeleteResponse';
import { ExtendedResponse } from './messages/ExtendedResponse';
import { ModifyDNResponse } from './messages/ModifyDNResponse';
import { MessageResponse } from './messages/MessageResponse';
import { MessageParserError } from './errors/MessageParserError';

type MessageParserEmitter = StrictEventEmitter<EventEmitter, MessageParserEvents>;

interface MessageParserEvents {
  message: (message: MessageResponse) => void;
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

  private _getMessageFromProtocolOperation(reader: BerReader): MessageResponse {
    const messageId = reader.readInt();
    const protocolOperation: ProtocolOperation = reader.readSequence();

    let message: MessageResponse;
    switch (protocolOperation) {
      case ProtocolOperation.LDAP_RES_BIND:
        message = new BindResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_COMPARE:
        message = new CompareResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_DELETE:
        message = new DeleteResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_EXTENSION:
        message = new ExtendedResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_MODRDN:
        message = new ModifyDNResponse({
          messageId,
        });
        break;
      default:
        const error = new MessageParserError(`Protocol Operation not supported: 0x${protocolOperation.toString(16)}`);
        error.messageDetails = {
          messageId,
          protocolOperation,
        };

        throw error;
    }

    message.parse(reader);
    return message;
  }
}

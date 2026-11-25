import { EventEmitter } from 'node:events';

import { type StrictEventEmitter } from 'strict-event-emitter-types';

import { BerReader } from './ber/index.js';
import { MessageParserError } from './errors/MessageParserError.js';
import { AddResponse, BindResponse, CompareResponse, DeleteResponse, ExtendedResponse, ModifyDNResponse, ModifyResponse, SearchEntry, SearchReference, SearchResponse } from './messages/index.js';
import { type Message } from './messages/Message.js';
import { type MessageResponse } from './messages/MessageResponse.js';
import { type ProtocolOperationValues } from './ProtocolOperation.js';
import { ProtocolOperation } from './ProtocolOperation.js';

interface MessageParserEvents {
  message: (message: MessageResponse) => void;
  error: (error: Error) => void;
}

type MessageParserEmitter = StrictEventEmitter<EventEmitter, MessageParserEvents>;

const TypedEventEmitter: new () => MessageParserEmitter = EventEmitter;

export class MessageParser extends TypedEventEmitter {
  private buffer?: Buffer;

  public read(data: Buffer, messageDetailsByMessageId: Map<string, { message: Message }>): void {
    // Iterate rather than recurse: how many messages share one chunk is decided
    // by TCP, so recursion would make the call depth depend on the network.
    let remaining: Buffer | undefined = data;
    while (remaining) {
      remaining = this._readMessage(remaining, messageDetailsByMessageId);
    }
  }

  /**
   * Parses the first complete message in the buffered data.
   * @returns Data received after that message, which still needs parsing
   */
  private _readMessage(data: Buffer, messageDetailsByMessageId: Map<string, { message: Message }>): Buffer | undefined {
    let nextMessage: Buffer | undefined;

    if (this.buffer) {
      this.buffer = Buffer.concat([this.buffer, data]);
    } else {
      this.buffer = data;
    }

    const reader = new BerReader(this.buffer);
    let foundSequence: number | null = null;

    try {
      foundSequence = reader.readSequence(0x30);
    } catch (ex) {
      // The framing itself is invalid, so later data cannot be parsed against it. Drop it rather than keep appending.
      delete this.buffer;
      this.emit('error', ex as Error);
      return undefined;
    }

    if (foundSequence === null || reader.remain < reader.length) {
      // Have not received enough data to successfully parse
      return undefined;
    }

    const messageEnd = reader.offset + reader.length;
    if (reader.remain > reader.length) {
      // Received too much data - extract next message
      nextMessage = this.buffer.subarray(messageEnd);
    }

    // The whole message is buffered now, so an inner element that runs past its end is malformed. Read it strictly:
    // returning null for a short read would leave parse loops that never advance.
    const messageReader = new BerReader(this.buffer.subarray(0, messageEnd), { strict: true });
    messageReader.offset = reader.offset;

    // Free up space since `messageReader` holds the current message and `nextMessage` is temporarily pointing
    // at the next sequence of data (if it exists)
    delete this.buffer;

    let messageId: number | null | undefined;
    let protocolOperation: number | null | undefined;

    try {
      messageId = messageReader.readInt();
      if (messageId == null) {
        throw new Error(`Unable to read message id`);
      }

      protocolOperation = messageReader.readSequence();

      if (protocolOperation == null) {
        throw new Error(`Unable to read protocol operation sequence for message: ${messageId}`);
      }

      const messageDetails = messageDetailsByMessageId.get(`${messageId}`);

      const message = this._getMessageFromProtocolOperation(messageId, protocolOperation, messageReader, messageDetails?.message);

      this.emit('message', message);
    } catch (ex) {
      if (messageId) {
        const errorWithMessageDetails = ex as MessageParserError;
        errorWithMessageDetails.messageDetails = {
          messageId,
        };

        if (protocolOperation) {
          errorWithMessageDetails.messageDetails.protocolOperation = protocolOperation;
        }

        this.emit('error', errorWithMessageDetails);
        return undefined;
      }

      this.emit('error', ex as Error);
      return undefined;
    }

    return nextMessage;
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private _getMessageFromProtocolOperation(messageId: number, protocolOperation: ProtocolOperationValues | number, reader: BerReader, messageDetails?: Message): MessageResponse {
    let message: MessageResponse;

    switch (protocolOperation) {
      case ProtocolOperation.LDAP_RES_BIND:
        message = new BindResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_ADD:
        message = new AddResponse({
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
      case ProtocolOperation.LDAP_RES_MODIFY:
        message = new ModifyResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH:
        message = new SearchResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH_ENTRY:
        message = new SearchEntry({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH_REF:
        message = new SearchReference({
          messageId,
        });
        break;
      default: {
        const error = new MessageParserError(`Protocol Operation not supported: 0x${protocolOperation.toString(16)}`);
        error.messageDetails = {
          messageId,
          protocolOperation,
        };

        throw error;
      }
    }

    message.parse(reader, messageDetails?.controls ?? []);
    return message;
  }
}

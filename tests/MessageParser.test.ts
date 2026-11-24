import { describe, expect, it } from 'vite-plus/test';

import { InvalidAsn1Error } from '../src/ber/index.js';
import { MessageParser } from '../src/MessageParser.js';
import { type MessageResponse } from '../src/messages/MessageResponse.js';
import { SearchEntry } from '../src/messages/SearchEntry.js';

interface ParseResult {
  messages: MessageResponse[];
  errors: Error[];
}

function parse(...chunks: number[][]): ParseResult {
  const parser = new MessageParser();
  const result: ParseResult = { messages: [], errors: [] };
  parser.on('message', (message) => result.messages.push(message));
  parser.on('error', (error) => result.errors.push(error));
  for (const chunk of chunks) {
    parser.read(Buffer.from(chunk), new Map());
  }

  return result;
}

// LDAPMessage { id 1, SearchResultEntry { "a", attributes { { "c", SET { "d" } } } } }
const searchEntry = [0x30, 0x14, 0x02, 0x01, 0x01, 0x64, 0x0f, 0x04, 0x01, 0x61, 0x30, 0x0a, 0x30, 0x08, 0x04, 0x01, 0x63, 0x31, 0x03, 0x04, 0x01, 0x64];

describe('MessageParser', () => {
  it('should parse a search entry', () => {
    const { messages, errors } = parse(searchEntry);
    expect(errors).toStrictEqual([]);
    expect(messages).toHaveLength(1);
    const entry = messages[0] as SearchEntry;
    expect(entry).toBeInstanceOf(SearchEntry);
    expect(entry.name).toBe('a');
    expect(entry.attributes.map((attribute) => [attribute.type, attribute.values])).toStrictEqual([['c', ['d']]]);
  });

  it('should wait for the rest of a message split across reads', () => {
    const { messages, errors } = parse(searchEntry.slice(0, 9), searchEntry.slice(9));
    expect(errors).toStrictEqual([]);
    expect(messages).toHaveLength(1);
  });

  describe('malformed responses', () => {
    it.each([
      // Attribute list declares 0x7f bytes, but only 5 bytes remain in the message
      ['search entry attribute list', [0x30, 0x0f, 0x02, 0x01, 0x01, 0x64, 0x0a, 0x04, 0x01, 0x61, 0x30, 0x7f, 0x30, 0x03, 0x04, 0x01, 0x63]],
      // Last attribute value declares 0x7f bytes, but only 1 byte remains
      ['search entry attribute value', [0x30, 0x13, 0x02, 0x01, 0x01, 0x64, 0x0e, 0x04, 0x01, 0x61, 0x30, 0x09, 0x30, 0x07, 0x04, 0x01, 0x63, 0x31, 0x03, 0x04, 0x7f, 0x64]],
      // Reference URI declares 0x7f bytes, but only 1 byte remains
      ['search reference uri', [0x30, 0x08, 0x02, 0x01, 0x01, 0x73, 0x03, 0x04, 0x7f, 0x61]],
      // Reference URI declares 0xfffffffa bytes, which is negative if decoded as a signed 32-bit integer
      ['search reference uri with a 4-byte length', [0x30, 0x0d, 0x02, 0x01, 0x01, 0x73, 0x08, 0x04, 0x84, 0xff, 0xff, 0xff, 0xfa, 0x61, 0x61]],
      // Controls declare 5 bytes, but none remain
      ['response controls', [0x30, 0x0e, 0x02, 0x01, 0x01, 0x61, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00, 0xa0, 0x05]],
    ])('should emit an error when the %s overruns the message', (_, pdu) => {
      const { messages, errors } = parse(pdu);
      expect(messages).toStrictEqual([]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(InvalidAsn1Error);
    });

    it('should drop invalid framing so later data is parsed fresh', () => {
      // Outer sequence uses an indefinite length, which is not supported
      const { messages, errors } = parse([0x30, 0x80], searchEntry);
      expect(errors).toHaveLength(1);
      expect(messages).toHaveLength(1);
    });
  });
});

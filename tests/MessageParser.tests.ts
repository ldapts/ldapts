import type { BerReader, BerWriter } from 'asn1';
import chai from 'chai';

import type { MessageDetails } from '../src';
import { Control, MessageParser, BindRequest, BindResponse } from '../src';

describe('MessageParser', () => {
  let expect: Chai.ExpectStatic;
  before(() => {
    expect = chai.expect;
  });

  describe('#read()', () => {
    it('should parse custom controls', () => {
      const actions: string[] = [];
      class TestControl extends Control {
        public constructor() {
          super('1.3.6.1.4.1.42.2.27.8.5.1');
        }

        public override parse(reader: BerReader): void {
          super.parse(reader);

          actions.push('TestControl - parse');
        }

        public override write(writer: BerWriter): void {
          super.write(writer);

          actions.push('TestControl - write');
        }
      }

      const messageId = 42;

      const bindRequest = new BindRequest({
        messageId,
        dn: 'test',
        password: 'test',
        controls: [new TestControl()],
      });

      const messageDetailsByMessageId: Record<string, MessageDetails> = {
        [`${messageId}`]: {
          message: bindRequest,
        },
      };

      const bindResponse = new BindResponse({
        messageId,
        status: 0,
        controls: [new TestControl()],
      });

      const responseMessageBuffer = bindResponse.write();
      expect(actions).to.deep.equal(['TestControl - write']);

      const parser = new MessageParser(messageDetailsByMessageId);
      parser.read(responseMessageBuffer);

      expect(actions).to.deep.equal(['TestControl - write', 'TestControl - parse']);
    });
    it('should not parse custom controls if control type is not in response', () => {
      const actions: string[] = [];
      class TestControl extends Control {
        public constructor() {
          super('1.3.6.1.4.1.42.2.27.8.5.1');
        }

        public override parse(reader: BerReader): void {
          super.parse(reader);

          actions.push('TestControl - parse');
        }

        public override write(writer: BerWriter): void {
          super.write(writer);

          actions.push('TestControl - write');
        }
      }

      const messageId = 42;

      const bindRequest = new BindRequest({
        messageId,
        controls: [new TestControl()],
      });

      const messageDetailsByMessageId: Record<string, MessageDetails> = {
        [`${messageId}`]: {
          message: bindRequest,
        },
      };

      const bindResponse = new BindResponse({
        messageId,
      });

      const responseMessageBuffer = bindResponse.write();
      const parser = new MessageParser(messageDetailsByMessageId);
      parser.read(responseMessageBuffer);

      expect(actions).to.deep.equal([]);
    });
  });
});

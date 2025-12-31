/* eslint-disable @typescript-eslint/no-non-null-assertion, no-useless-concat */
import 'chai/register-should.js';

import { Ber, BerReader, InvalidAsn1Error } from '../../src/ber/index.js';

describe('BerReader', () => {
  describe('constructor', () => {
    it('should throw TypeError when no data provided', () => {
      (() => new BerReader(undefined as unknown as Buffer)).should.throw(TypeError, 'data must be a Buffer');
    });

    it('should accept a Buffer', () => {
      const reader = new BerReader(Buffer.from([0x01]));
      reader.should.be.instanceOf(BerReader);
    });
  });

  describe('#readByte()', () => {
    it('should read a single byte', () => {
      const reader = new BerReader(Buffer.from([0xde]));
      reader.readByte()!.should.equal(0xde);
    });

    it('should return null when no data remains', () => {
      const reader = new BerReader(Buffer.from([]));
      (reader.readByte() === null).should.equal(true);
    });

    it('should not advance offset when peeking', () => {
      const reader = new BerReader(Buffer.from([0xde, 0xad]));
      reader.readByte(true)!.should.equal(0xde);
      reader.readByte(true)!.should.equal(0xde);
      reader.offset.should.equal(0);
    });
  });

  describe('#peek()', () => {
    it('should return next byte without advancing', () => {
      const reader = new BerReader(Buffer.from([0xde, 0xad]));
      reader.peek()!.should.equal(0xde);
      reader.peek()!.should.equal(0xde);
    });
  });

  describe('#readInt()', () => {
    it('should read 1 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0x03]));
      reader.readInt()!.should.equal(0x03);
      reader.length.should.equal(0x01);
    });

    it('should read 2 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x02, 0x7e, 0xde]));
      reader.readInt()!.should.equal(0x7ede);
      reader.length.should.equal(0x02);
    });

    it('should read 3 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x03, 0x7e, 0xde, 0x03]));
      reader.readInt()!.should.equal(0x7ede03);
      reader.length.should.equal(0x03);
    });

    it('should read 4 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x04, 0x7e, 0xde, 0x03, 0x01]));
      reader.readInt()!.should.equal(0x7ede0301);
      reader.length.should.equal(0x04);
    });

    it('should read 1 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0xdc]));
      reader.readInt()!.should.equal(-36);
      reader.length.should.equal(0x01);
    });

    it('should read 2 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x02, 0xc0, 0x4e]));
      reader.readInt()!.should.equal(-16306);
      reader.length.should.equal(0x02);
    });

    it('should read 3 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x03, 0xff, 0x00, 0x19]));
      reader.readInt()!.should.equal(-65511);
      reader.length.should.equal(0x03);
    });

    it('should read 4 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x04, 0x91, 0x7c, 0x22, 0x1f]));
      reader.readInt()!.should.equal(-1854135777);
      reader.length.should.equal(0x04);
    });

    it('should throw on wrong tag', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x01, 0x03]));
      (() => reader.readInt()).should.throw(InvalidAsn1Error, 'Expected 0x2: got 0x4');
    });
  });

  describe('#readBoolean()', () => {
    it('should read true', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x01, 0xff]));
      reader.readBoolean()!.should.equal(true);
      reader.length.should.equal(0x01);
    });

    it('should read false', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x01, 0x00]));
      reader.readBoolean()!.should.equal(false);
      reader.length.should.equal(0x01);
    });
  });

  describe('#readEnumeration()', () => {
    it('should read enumeration value', () => {
      const reader = new BerReader(Buffer.from([0x0a, 0x01, 0x20]));
      reader.readEnumeration()!.should.equal(0x20);
      reader.length.should.equal(0x01);
    });
  });

  describe('#readString()', () => {
    it('should read string', () => {
      const dn = 'cn=foo,ou=unit,o=test';
      const buf = Buffer.alloc(dn.length + 2);
      buf[0] = 0x04;
      buf[1] = Buffer.byteLength(dn);
      buf.write(dn, 2);

      const reader = new BerReader(buf);
      reader.readString()!.should.equal(dn);
      reader.length.should.equal(dn.length);
    });

    it('should read empty string', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x00]));
      reader.readString()!.should.equal('');
      reader.length.should.equal(0);
    });

    it('should read string as buffer', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x03, 0x66, 0x6f, 0x6f]));
      const result = reader.readString(Ber.OctetString, true)!;
      Buffer.isBuffer(result).should.equal(true);
      result.toString().should.equal('foo');
    });

    it('should read long string (extended length encoding)', () => {
      const longString = '2;649;CN=Red Hat CS 71GA Demo,O=Red Hat CS 71GA Demo,C=US;' + 'CN=RHCS Agent - admin01,UID=admin01,O=redhat,C=US [1] This is ' + 'a comment. [2] Some Role in the CS';

      const buf = Buffer.alloc(3 + longString.length);
      buf[0] = 0x04;
      buf[1] = 0x81;
      buf[2] = longString.length;
      buf.write(longString, 3);

      const reader = new BerReader(buf);
      reader.readString()!.should.equal(longString);
      reader.length.should.equal(longString.length);
    });

    it('should throw on wrong tag', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0x03]));
      (() => reader.readString()).should.throw(InvalidAsn1Error, 'Expected 0x4: got 0x2');
    });
  });

  describe('#readSequence()', () => {
    it('should read sequence', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));
      reader.readSequence()!.should.equal(0x30);
      reader.length.should.equal(0x03);
      reader.readBoolean()!.should.equal(true);
      reader.length.should.equal(0x01);
    });

    it('should validate expected tag', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));
      (() => reader.readSequence(0x31)).should.throw(InvalidAsn1Error, 'Expected 0x31: got 0x30');
    });
  });

  describe('#readOID()', () => {
    it('should read OID', () => {
      const reader = new BerReader(Buffer.from([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]));
      reader.readOID()!.should.equal('1.2.840.113549.1.1.1');
    });
  });

  describe('LDAP message parsing', () => {
    it('should parse anonymous LDAPv3 bind request', () => {
      const bindRequest = Buffer.from([0x30, 12, 0x02, 1, 0x04, 0x60, 7, 0x02, 1, 0x03, 0x04, 0, 0x80, 0]);

      const reader = new BerReader(bindRequest);
      reader.readSequence()!.should.equal(0x30);
      reader.length.should.equal(12);
      reader.readInt()!.should.equal(4);
      reader.readSequence()!.should.equal(0x60);
      reader.length.should.equal(7);
      reader.readInt()!.should.equal(3);
      reader.readString()!.should.equal('');
      reader.length.should.equal(0);
      reader.readByte()!.should.equal(0x80);
      reader.readByte()!.should.equal(0);
      (reader.readByte() === null).should.equal(true);
    });
  });

  describe('buffer properties', () => {
    it('should track offset correctly', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      reader.offset.should.equal(0);
      reader.readByte();
      reader.offset.should.equal(1);
      reader.readByte();
      reader.offset.should.equal(2);
    });

    it('should track remaining bytes', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      reader.remain.should.equal(4);
      reader.readByte();
      reader.remain.should.equal(3);
    });

    it('should return remaining buffer', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      reader.readByte();
      reader.readByte();
      reader.remainingBuffer.should.deep.equal(Buffer.from([0x03, 0x04]));
    });
  });

  describe('issue #151 - buffer misalignment', () => {
    it('should handle multiple LDAP messages in single buffer', () => {
      const message1 = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x01, 0x04, 0x01, 0x41]);
      const message2 = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x02, 0x04, 0x01, 0x42]);
      const combined = Buffer.concat([message1, message2]);

      const reader1 = new BerReader(combined);
      reader1.readSequence()!.should.equal(0x30);
      reader1.readInt()!.should.equal(1);
      reader1.readString()!.should.equal('A');

      const remaining = combined.subarray(reader1.offset);
      const reader2 = new BerReader(remaining);
      reader2.readSequence()!.should.equal(0x30);
      reader2.readInt()!.should.equal(2);
      reader2.readString()!.should.equal('B');
    });

    it('should handle setBufferSize for partial reads', () => {
      const message = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x01, 0x04, 0x01, 0x41, 0xff, 0xff]);
      const reader = new BerReader(message);

      reader.setBufferSize(8);
      reader.readSequence()!.should.equal(0x30);
      reader.readInt()!.should.equal(1);
      reader.readString()!.should.equal('A');
      reader.remain.should.equal(0);
    });

    it('should correctly calculate remain after setBufferSize', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      const reader = new BerReader(buffer);

      reader.remain.should.equal(6);
      reader.setBufferSize(4);
      reader.remain.should.equal(4);
      reader.readByte();
      reader.remain.should.equal(3);
    });
  });

  describe('length encoding', () => {
    it('should handle short form length (0-127)', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]));
      reader.readString()!.should.equal('hello');
    });

    it('should handle long form length with 1 byte', () => {
      const data = Buffer.alloc(131);
      data[0] = 0x04;
      data[1] = 0x81;
      data[2] = 128;
      data.fill(0x41, 3);

      const reader = new BerReader(data);
      const result = reader.readString()!;
      result.length.should.equal(128);
      result.should.equal('A'.repeat(128));
    });

    it('should handle long form length with 2 bytes', () => {
      const data = Buffer.alloc(260);
      data[0] = 0x04;
      data[1] = 0x82;
      data[2] = 0x01;
      data[3] = 0x00;
      data.fill(0x42, 4);

      const reader = new BerReader(data);
      const result = reader.readString()!;
      result.length.should.equal(256);
      result.should.equal('B'.repeat(256));
    });

    it('should throw on indefinite length', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x80]));
      (() => reader.readSequence()).should.throw(InvalidAsn1Error, 'Indefinite length not supported');
    });

    it('should throw on encoding too long', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x85, 0x01, 0x02, 0x03, 0x04, 0x05]));
      (() => reader.readSequence()).should.throw(InvalidAsn1Error, 'Encoding too long');
    });
  });
});

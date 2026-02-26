/* eslint-disable no-useless-concat */
import { describe, expect, it } from 'vitest';

import { Ber, BerReader } from '../../src/ber/index.js';

describe('BerReader', () => {
  describe('constructor', () => {
    it('should throw TypeError when no data provided', () => {
      expect(() => new BerReader(undefined as unknown as Buffer)).toThrow('data must be a Buffer');
    });

    it('should accept a Buffer', () => {
      const reader = new BerReader(Buffer.from([0x01]));
      expect(reader).toBeInstanceOf(BerReader);
    });
  });

  describe('#readByte()', () => {
    it('should read a single byte', () => {
      const reader = new BerReader(Buffer.from([0xde]));
      expect(reader.readByte()!).toBe(0xde);
    });

    it('should return null when no data remains', () => {
      const reader = new BerReader(Buffer.from([]));
      expect(reader.readByte()).toBeNull();
    });

    it('should not advance offset when peeking', () => {
      const reader = new BerReader(Buffer.from([0xde, 0xad]));
      expect(reader.readByte(true)!).toBe(0xde);
      expect(reader.readByte(true)!).toBe(0xde);
      expect(reader.offset).toBe(0);
    });
  });

  describe('#peek()', () => {
    it('should return next byte without advancing', () => {
      const reader = new BerReader(Buffer.from([0xde, 0xad]));
      expect(reader.peek()!).toBe(0xde);
      expect(reader.peek()!).toBe(0xde);
    });
  });

  describe('#readInt()', () => {
    it('should read 1 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0x03]));
      expect(reader.readInt()!).toBe(0x03);
      expect(reader.length).toBe(0x01);
    });

    it('should read 2 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x02, 0x7e, 0xde]));
      expect(reader.readInt()!).toBe(0x7ede);
      expect(reader.length).toBe(0x02);
    });

    it('should read 3 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x03, 0x7e, 0xde, 0x03]));
      expect(reader.readInt()!).toBe(0x7ede03);
      expect(reader.length).toBe(0x03);
    });

    it('should read 4 byte integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x04, 0x7e, 0xde, 0x03, 0x01]));
      expect(reader.readInt()!).toBe(0x7ede0301);
      expect(reader.length).toBe(0x04);
    });

    it('should read 1 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0xdc]));
      expect(reader.readInt()!).toBe(-36);
      expect(reader.length).toBe(0x01);
    });

    it('should read 2 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x02, 0xc0, 0x4e]));
      expect(reader.readInt()!).toBe(-16306);
      expect(reader.length).toBe(0x02);
    });

    it('should read 3 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x03, 0xff, 0x00, 0x19]));
      expect(reader.readInt()!).toBe(-65511);
      expect(reader.length).toBe(0x03);
    });

    it('should read 4 byte negative integer', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x04, 0x91, 0x7c, 0x22, 0x1f]));
      expect(reader.readInt()!).toBe(-1854135777);
      expect(reader.length).toBe(0x04);
    });

    it('should throw on wrong tag', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x01, 0x03]));
      expect(() => reader.readInt()).toThrow('Expected 0x2: got 0x4');
    });
  });

  describe('#readBoolean()', () => {
    it('should read true', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x01, 0xff]));
      expect(reader.readBoolean()!).toBe(true);
      expect(reader.length).toBe(0x01);
    });

    it('should read false', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x01, 0x00]));
      expect(reader.readBoolean()!).toBe(false);
      expect(reader.length).toBe(0x01);
    });
  });

  describe('#readEnumeration()', () => {
    it('should read enumeration value', () => {
      const reader = new BerReader(Buffer.from([0x0a, 0x01, 0x20]));
      expect(reader.readEnumeration()!).toBe(0x20);
      expect(reader.length).toBe(0x01);
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
      expect(reader.readString()!).toBe(dn);
      expect(reader.length).toBe(dn.length);
    });

    it('should read empty string', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x00]));
      expect(reader.readString()!).toBe('');
      expect(reader.length).toBe(0);
    });

    it('should read string as buffer', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x03, 0x66, 0x6f, 0x6f]));
      const result = reader.readString(Ber.OctetString, true)!;
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('foo');
    });

    it('should read long string (extended length encoding)', () => {
      const longString = '2;649;CN=Red Hat CS 71GA Demo,O=Red Hat CS 71GA Demo,C=US;' + 'CN=RHCS Agent - admin01,UID=admin01,O=redhat,C=US [1] This is ' + 'a comment. [2] Some Role in the CS';

      const buf = Buffer.alloc(3 + longString.length);
      buf[0] = 0x04;
      buf[1] = 0x81;
      buf[2] = longString.length;
      buf.write(longString, 3);

      const reader = new BerReader(buf);
      expect(reader.readString()!).toBe(longString);
      expect(reader.length).toBe(longString.length);
    });

    it('should throw on wrong tag', () => {
      const reader = new BerReader(Buffer.from([0x02, 0x01, 0x03]));
      expect(() => reader.readString()).toThrow('Expected 0x4: got 0x2');
    });
  });

  describe('#readSequence()', () => {
    it('should read sequence', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.length).toBe(0x03);
      expect(reader.readBoolean()!).toBe(true);
      expect(reader.length).toBe(0x01);
    });

    it('should validate expected tag', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));
      expect(() => reader.readSequence(0x31)).toThrow('Expected 0x31: got 0x30');
    });
  });

  describe('#readOID()', () => {
    it('should read OID', () => {
      const reader = new BerReader(Buffer.from([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]));
      expect(reader.readOID()!).toBe('1.2.840.113549.1.1.1');
    });
  });

  describe('LDAP message parsing', () => {
    it('should parse anonymous LDAPv3 bind request', () => {
      const bindRequest = Buffer.from([0x30, 12, 0x02, 1, 0x04, 0x60, 7, 0x02, 1, 0x03, 0x04, 0, 0x80, 0]);

      const reader = new BerReader(bindRequest);
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.length).toBe(12);
      expect(reader.readInt()!).toBe(4);
      expect(reader.readSequence()!).toBe(0x60);
      expect(reader.length).toBe(7);
      expect(reader.readInt()!).toBe(3);
      expect(reader.readString()!).toBe('');
      expect(reader.length).toBe(0);
      expect(reader.readByte()!).toBe(0x80);
      expect(reader.readByte()!).toBe(0);
      expect(reader.readByte()).toBeNull();
    });
  });

  describe('buffer properties', () => {
    it('should track offset correctly', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      expect(reader.offset).toBe(0);
      reader.readByte();
      expect(reader.offset).toBe(1);
      reader.readByte();
      expect(reader.offset).toBe(2);
    });

    it('should track remaining bytes', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      expect(reader.remain).toBe(4);
      reader.readByte();
      expect(reader.remain).toBe(3);
    });

    it('should return remaining buffer', () => {
      const reader = new BerReader(Buffer.from([0x01, 0x02, 0x03, 0x04]));
      reader.readByte();
      reader.readByte();
      expect(reader.remainingBuffer).toStrictEqual(Buffer.from([0x03, 0x04]));
    });
  });

  describe('issue #151 - buffer misalignment', () => {
    it('should handle multiple LDAP messages in single buffer', () => {
      const message1 = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x01, 0x04, 0x01, 0x41]);
      const message2 = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x02, 0x04, 0x01, 0x42]);
      const combined = Buffer.concat([message1, message2]);

      const reader1 = new BerReader(combined);
      expect(reader1.readSequence()!).toBe(0x30);
      expect(reader1.readInt()!).toBe(1);
      expect(reader1.readString()!).toBe('A');

      const remaining = combined.subarray(reader1.offset);
      const reader2 = new BerReader(remaining);
      expect(reader2.readSequence()!).toBe(0x30);
      expect(reader2.readInt()!).toBe(2);
      expect(reader2.readString()!).toBe('B');
    });

    it('should handle setBufferSize for partial reads', () => {
      const message = Buffer.from([0x30, 0x06, 0x02, 0x01, 0x01, 0x04, 0x01, 0x41, 0xff, 0xff]);
      const reader = new BerReader(message);

      reader.setBufferSize(8);
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readInt()!).toBe(1);
      expect(reader.readString()!).toBe('A');
      expect(reader.remain).toBe(0);
    });

    it('should correctly calculate remain after setBufferSize', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      const reader = new BerReader(buffer);

      expect(reader.remain).toBe(6);
      reader.setBufferSize(4);
      expect(reader.remain).toBe(4);
      reader.readByte();
      expect(reader.remain).toBe(3);
    });
  });

  describe('length encoding', () => {
    it('should handle short form length (0-127)', () => {
      const reader = new BerReader(Buffer.from([0x04, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]));
      expect(reader.readString()!).toBe('hello');
    });

    it('should handle long form length with 1 byte', () => {
      const data = Buffer.alloc(131);
      data[0] = 0x04;
      data[1] = 0x81;
      data[2] = 128;
      data.fill(0x41, 3);

      const reader = new BerReader(data);
      const result = reader.readString()!;
      expect(result.length).toBe(128);
      expect(result).toBe('A'.repeat(128));
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
      expect(result.length).toBe(256);
      expect(result).toBe('B'.repeat(256));
    });

    it('should throw on indefinite length', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x80]));
      expect(() => reader.readSequence()).toThrow('Indefinite length not supported');
    });

    it('should throw on encoding too long', () => {
      const reader = new BerReader(Buffer.from([0x30, 0x85, 0x01, 0x02, 0x03, 0x04, 0x05]));
      expect(() => reader.readSequence()).toThrow('Encoding too long');
    });
  });
});

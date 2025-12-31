import 'chai/register-should.js';

import { decodePostalAddress, encodePostalAddress } from '../src/PostalAddress.js';

describe('PostalAddress', () => {
  describe('#encodePostalAddress()', () => {
    it('should encode multiple lines with $ separator', () => {
      encodePostalAddress('1640 Riverside Drive\nHill Valley, CA 91103\nUSA').should.equal('1640 Riverside Drive$Hill Valley, CA 91103$USA');
    });

    it('should encode single line without separator', () => {
      encodePostalAddress('1640 Riverside Drive').should.equal('1640 Riverside Drive');
    });

    it('should escape $ characters', () => {
      encodePostalAddress('Price: $100\nTotal').should.equal('Price: \\24100$Total');
    });

    it('should escape \\ characters', () => {
      encodePostalAddress('Path: C:\\Users\nLocation').should.equal('Path: C:\\5CUsers$Location');
    });

    it('should escape both $ and \\ in same line', () => {
      encodePostalAddress('Cost: $50\\item').should.equal('Cost: \\2450\\5Citem');
    });

    it('should handle empty lines', () => {
      encodePostalAddress('Line 1\n\nLine 3').should.equal('Line 1$$Line 3');
    });

    it('should handle empty string', () => {
      encodePostalAddress('').should.equal('');
    });

    it('should support custom separator', () => {
      encodePostalAddress('Line 1|Line 2', '|').should.equal('Line 1$Line 2');
    });
  });

  describe('#decodePostalAddress()', () => {
    it('should decode $ separated lines', () => {
      decodePostalAddress('1640 Riverside Drive$Hill Valley, CA 91103$USA').should.equal('1640 Riverside Drive\nHill Valley, CA 91103\nUSA');
    });

    it('should decode single line', () => {
      decodePostalAddress('1640 Riverside Drive').should.equal('1640 Riverside Drive');
    });

    it('should unescape \\24 to $', () => {
      decodePostalAddress('Price: \\24100$Total').should.equal('Price: $100\nTotal');
    });

    it('should unescape \\5C to \\', () => {
      decodePostalAddress('Path: C:\\5CUsers$Location').should.equal('Path: C:\\Users\nLocation');
    });

    it('should handle case-insensitive escape sequences', () => {
      decodePostalAddress('\\5c\\5C\\24').should.equal('\\\\$');
    });

    it('should unescape both $ and \\ in same line', () => {
      decodePostalAddress('Cost: \\2450\\5Citem').should.equal('Cost: $50\\item');
    });

    it('should handle empty lines', () => {
      decodePostalAddress('Line 1$$Line 3').should.equal('Line 1\n\nLine 3');
    });

    it('should handle empty string', () => {
      decodePostalAddress('').should.equal('');
    });

    it('should support custom separator', () => {
      decodePostalAddress('Line 1$Line 2', '|').should.equal('Line 1|Line 2');
    });
  });

  describe('round-trip', () => {
    it('should return original after encode then decode', () => {
      const original = '1640 Riverside Drive\nSuite $500\nPath\\to\\place';
      decodePostalAddress(encodePostalAddress(original)).should.equal(original);
    });

    it('should handle complex addresses', () => {
      const original = 'Acme Corp \\ Inc.\nBuilding $1, Floor 5\n1640 Riverside Drive\nHill Valley, CA 91103\nUSA';
      decodePostalAddress(encodePostalAddress(original)).should.equal(original);
    });
  });
});

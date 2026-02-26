import { describe, expect, it } from 'vitest';

import { decodePostalAddress, encodePostalAddress } from '../src/PostalAddress.js';

describe('PostalAddress', () => {
  describe('#encodePostalAddress()', () => {
    it('should encode multiple lines with $ separator', () => {
      expect(encodePostalAddress('1640 Riverside Drive\nHill Valley, CA 91103\nUSA')).toBe('1640 Riverside Drive$Hill Valley, CA 91103$USA');
    });

    it('should encode single line without separator', () => {
      expect(encodePostalAddress('1640 Riverside Drive')).toBe('1640 Riverside Drive');
    });

    it('should escape $ characters', () => {
      expect(encodePostalAddress('Price: $100\nTotal')).toBe('Price: \\24100$Total');
    });

    it('should escape \\ characters', () => {
      expect(encodePostalAddress('Path: C:\\Users\nLocation')).toBe('Path: C:\\5CUsers$Location');
    });

    it('should escape both $ and \\ in same line', () => {
      expect(encodePostalAddress('Cost: $50\\item')).toBe('Cost: \\2450\\5Citem');
    });

    it('should handle empty lines', () => {
      expect(encodePostalAddress('Line 1\n\nLine 3')).toBe('Line 1$$Line 3');
    });

    it('should handle empty string', () => {
      expect(encodePostalAddress('')).toBe('');
    });

    it('should support custom separator', () => {
      expect(encodePostalAddress('Line 1|Line 2', '|')).toBe('Line 1$Line 2');
    });
  });

  describe('#decodePostalAddress()', () => {
    it('should decode $ separated lines', () => {
      expect(decodePostalAddress('1640 Riverside Drive$Hill Valley, CA 91103$USA')).toBe('1640 Riverside Drive\nHill Valley, CA 91103\nUSA');
    });

    it('should decode single line', () => {
      expect(decodePostalAddress('1640 Riverside Drive')).toBe('1640 Riverside Drive');
    });

    it('should unescape \\24 to $', () => {
      expect(decodePostalAddress('Price: \\24100$Total')).toBe('Price: $100\nTotal');
    });

    it('should unescape \\5C to \\', () => {
      expect(decodePostalAddress('Path: C:\\5CUsers$Location')).toBe('Path: C:\\Users\nLocation');
    });

    it('should handle case-insensitive escape sequences', () => {
      expect(decodePostalAddress('\\5c\\5C\\24')).toBe('\\\\$');
    });

    it('should unescape both $ and \\ in same line', () => {
      expect(decodePostalAddress('Cost: \\2450\\5Citem')).toBe('Cost: $50\\item');
    });

    it('should handle empty lines', () => {
      expect(decodePostalAddress('Line 1$$Line 3')).toBe('Line 1\n\nLine 3');
    });

    it('should handle empty string', () => {
      expect(decodePostalAddress('')).toBe('');
    });

    it('should support custom separator', () => {
      expect(decodePostalAddress('Line 1$Line 2', '|')).toBe('Line 1|Line 2');
    });
  });

  describe('round-trip', () => {
    it('should return original after encode then decode', () => {
      const original = '1640 Riverside Drive\nSuite $500\nPath\\to\\place';
      expect(decodePostalAddress(encodePostalAddress(original))).toBe(original);
    });

    it('should handle complex addresses', () => {
      const original = 'Acme Corp \\ Inc.\nBuilding $1, Floor 5\n1640 Riverside Drive\nHill Valley, CA 91103\nUSA';
      expect(decodePostalAddress(encodePostalAddress(original))).toBe(original);
    });
  });
});

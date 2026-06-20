import { describe, expect, it } from 'vitest';

import { Filter } from '../../src/index.js';

describe('Filter', () => {
  describe('#escape()', () => {
    it('should not touch plain letters', () => {
      expect(Filter.escape('x')).toBe('x');
    });
    it('should escape syntax characters', () => {
      expect(Filter.escape('*').toLowerCase()).toBe('\\2a');
      expect(Filter.escape('(').toLowerCase()).toBe('\\28');
      expect(Filter.escape(')').toLowerCase()).toBe('\\29');
      expect(Filter.escape('\\').toLowerCase()).toBe('\\5c');
      expect(Filter.escape('\0').toLowerCase()).toBe('\\00');
    });
  });
});

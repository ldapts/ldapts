import { describe, expect, it } from 'vitest';

import { EqualityFilter, Filter, OrFilter } from '../../src/index.js';

describe('OrFilter', () => {
  describe('#toString()', () => {
    it('should render sub filter toString values', () => {
      const displayNameFoo = new EqualityFilter({
        attribute: 'displayName',
        value: 'Foo',
      });
      const displayNameBar = new EqualityFilter({
        attribute: 'displayName',
        value: 'Bar',
      });

      const filter = new OrFilter({
        filters: [displayNameFoo, displayNameBar],
      });

      const fooName = `(${Filter.escape(displayNameFoo.attribute)}=${Filter.escape(displayNameFoo.value)})`;
      const barName = `(${Filter.escape(displayNameBar.attribute)}=${Filter.escape(displayNameBar.value)})`;
      expect(filter.toString()).toBe(`(|${fooName}${barName})`);
    });
  });
});

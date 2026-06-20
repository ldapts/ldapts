import { describe, expect, it } from 'vitest';

import { EqualityFilter, Filter, NotFilter } from '../../src/index.js';

describe('NotFilter', () => {
  describe('#toString()', () => {
    it('should render sub filter toString value', () => {
      const displayNameFoo = new EqualityFilter({
        attribute: 'displayName',
        value: 'Foo',
      });

      const filter = new NotFilter({
        filter: displayNameFoo,
      });

      const fooName = `(${Filter.escape(displayNameFoo.attribute)}=${Filter.escape(displayNameFoo.value)})`;
      expect(filter.toString()).toBe(`(!${fooName})`);
    });
  });
});

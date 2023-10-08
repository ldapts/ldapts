import chai from 'chai';

import { EqualityFilter, OrFilter } from '../../src/index.js';

describe('OrFilter', () => {
  before(() => {
    chai.should();
  });

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

      const fooName = `(${displayNameFoo.escape(displayNameFoo.attribute)}=${displayNameFoo.escape(displayNameFoo.value)})`;
      const barName = `(${displayNameBar.escape(displayNameBar.attribute)}=${displayNameBar.escape(displayNameBar.value)})`;
      filter.toString().should.equal(`(|${fooName}${barName})`);
    });
  });
});

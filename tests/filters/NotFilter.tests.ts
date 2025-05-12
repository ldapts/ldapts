import * as chai from 'chai';
import 'chai/register-should.js';

import { EqualityFilter, NotFilter } from '../../src/index.js';

describe('NotFilter', () => {
  before(() => {
    chai.should();
  });

  describe('#toString()', () => {
    it('should render sub filter toString value', () => {
      const displayNameFoo = new EqualityFilter({
        attribute: 'displayName',
        value: 'Foo',
      });

      const filter = new NotFilter({
        filter: displayNameFoo,
      });

      const fooName = `(${displayNameFoo.escape(displayNameFoo.attribute)}=${displayNameFoo.escape(displayNameFoo.value)})`;
      filter.toString().should.equal(`(!${fooName})`);
    });
  });
});

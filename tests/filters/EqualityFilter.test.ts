import { describe, expect, it, vi } from 'vitest';

import { type BerWriter } from '../../src/ber/index.js';
import { EqualityFilter } from '../../src/index.js';

describe('EqualityFilter', () => {
  describe('#writeFilter()', () => {
    it('should write: (o=Parens R Us (for all your parenthetical needs))', () => {
      const filter = new EqualityFilter({
        attribute: 'o',
        value: 'Parens R Us (for all your parenthetical needs)',
      });

      const berWriter = { writeString: vi.fn() } as unknown as BerWriter;

      filter.writeFilter(berWriter);

      /* eslint-disable @typescript-eslint/unbound-method */
      expect(berWriter.writeString).toHaveBeenCalledTimes(2);
      expect(berWriter.writeString).toHaveBeenNthCalledWith(1, 'o');
      expect(berWriter.writeString).toHaveBeenNthCalledWith(2, 'Parens R Us (for all your parenthetical needs)');
      /* eslint-enable @typescript-eslint/unbound-method */
    });

    it('should write: (displayName=My group (something))', () => {
      const filter = new EqualityFilter({
        attribute: 'displayName',
        value: 'My group (something)',
      });

      const berWriter = { writeString: vi.fn() } as unknown as BerWriter;

      filter.writeFilter(berWriter);

      /* eslint-disable @typescript-eslint/unbound-method */
      expect(berWriter.writeString).toHaveBeenCalledTimes(2);
      expect(berWriter.writeString).toHaveBeenNthCalledWith(1, 'displayName');
      expect(berWriter.writeString).toHaveBeenNthCalledWith(2, 'My group (something)');
      /* eslint-enable @typescript-eslint/unbound-method */
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import { type BerWriter } from '../../src/ber/index.js';
import { ExtensibleFilter } from '../../src/index.js';

describe('ExtensibleFilter', () => {
  describe('#writeFilter()', () => {
    it('should write: userAccountControl:1.2.840.113556.1.4.803:=2', () => {
      const filter = new ExtensibleFilter({
        matchType: 'userAccountControl',
        rule: '1.2.840.113556.1.4.803',
        value: '2',
      });

      const berWriter = {
        writeString: vi.fn(),
        writeBoolean: vi.fn(),
      } as unknown as BerWriter;

      filter.writeFilter(berWriter);

      /* eslint-disable @typescript-eslint/unbound-method */
      expect(berWriter.writeString).toHaveBeenCalledTimes(3);
      expect(berWriter.writeBoolean).toHaveBeenCalledTimes(0);
      expect(berWriter.writeString).toHaveBeenNthCalledWith(1, '1.2.840.113556.1.4.803', 129);
      expect(berWriter.writeString).toHaveBeenNthCalledWith(2, 'userAccountControl', 130);
      expect(berWriter.writeString).toHaveBeenNthCalledWith(3, '2', 131);
      /* eslint-enable @typescript-eslint/unbound-method */
    });
  });
});

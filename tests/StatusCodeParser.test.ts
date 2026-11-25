import { describe, expect, it } from 'vite-plus/test';

import { MoreResultsToReturnError, NoSuchObjectError, SearchResponse, StatusCodeParser, UnknownStatusCodeError } from '../src/index.js';

describe('StatusCodeParser', () => {
  describe('#parse()', () => {
    it('keeps the result-code description when the diagnostic is empty', () => {
      const error = StatusCodeParser.parse(
        new SearchResponse({
          messageId: 1,
          status: 32,
        }),
      );

      expect(error).toBeInstanceOf(NoSuchObjectError);
      expect(error.message).toContain('The target object cannot be found.');
    });

    it('prefers the server diagnostic when it is present', () => {
      const error = StatusCodeParser.parse(
        new SearchResponse({
          messageId: 1,
          status: 32,
          errorMessage: 'no such entry',
        }),
      );

      expect(error.message).toContain('no such entry');
    });

    it('keeps the default description for a status without a diagnostic', () => {
      const error = StatusCodeParser.parse(
        new SearchResponse({
          messageId: 1,
          status: 95,
        }),
      );

      expect(error).toBeInstanceOf(MoreResultsToReturnError);
      expect(error.message).toContain('More results to return.');
    });

    it('keeps the default description for an unknown status', () => {
      const error = StatusCodeParser.parse(
        new SearchResponse({
          messageId: 1,
          status: 999,
        }),
      );

      expect(error).toBeInstanceOf(UnknownStatusCodeError);
      expect(error.message).toContain('Unknown error.');
    });
  });
});

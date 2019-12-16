import chai from 'chai';
import { BerWriter } from 'asn1';
import {
 anyString, mock, capture, verify, when, instance, reset,
} from 'ts-mockito';
import { EqualityFilter } from '../../src/filters';

describe('EqualityFilter', () => {
  before(() => {
    chai.should();
  });

  describe('#writeFilter()', () => {
    const mockedWriter: BerWriter = mock(BerWriter);
    const berWriterInstance = instance(mockedWriter);

    beforeEach(() => {
      reset(mockedWriter);
    });

    it('should write: (o=Parens R Us (for all your parenthetical needs))', () => {
      const filter = new EqualityFilter({
        attribute: 'o',
        value: 'Parens R Us (for all your parenthetical needs)',
      });

      when(mockedWriter.writeString(anyString())).thenResolve();

      filter.writeFilter(berWriterInstance);

      verify(mockedWriter.writeString(anyString())).times(2);
      const writeStringCalls = capture(mockedWriter.writeString);
      writeStringCalls.first().should.deep.equal(['o']);
      writeStringCalls.second().should.deep.equal(['Parens R Us (for all your parenthetical needs)']);
    });
    it('should write: (displayName=My group (something))', () => {
      const filter = new EqualityFilter({
        attribute: 'displayName',
        value: 'My group (something)',
      });

      when(mockedWriter.writeString(anyString())).thenResolve();

      filter.writeFilter(berWriterInstance);

      verify(mockedWriter.writeString(anyString())).times(2);
      const writeStringCalls = capture(mockedWriter.writeString);
      writeStringCalls.first().should.deep.equal(['displayName']);
      writeStringCalls.second().should.deep.equal(['My group (something)']);
    });
  });
});

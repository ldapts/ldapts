// @ts-ignore
import chai, { should } from 'chai';
import { Ber, BerWriter } from 'asn1';
import { anyString, mock, capture, verify, anything, when, instance, reset } from 'ts-mockito';
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

    it('should write: (o=Parens R Us \\28for all your parenthetical needs\\29)', () => {
      const filter = new EqualityFilter({
        attribute: 'o',
        value: 'Parens R Us (for all your parenthetical needs)',
      });

      when(mockedWriter.writeString(anyString())).thenResolve();
      when(mockedWriter.writeString(anyString(), anything())).thenResolve();

      filter.writeFilter(berWriterInstance);

      verify(mockedWriter.writeString(anyString())).times(1);
      verify(mockedWriter.writeString(anyString(), anything())).times(1);
      const writeStringCalls = capture(mockedWriter.writeString);
      writeStringCalls.first().should.deep.equal(['o']);
      writeStringCalls.second().should.deep.equal(['Parens R Us \\28for all your parenthetical needs\\29', Ber.OctetString]);
    });
    it('should write: (displayName=My group \\28something\\29))', () => {
      const filter = new EqualityFilter({
        attribute: 'displayName',
        value: 'My group (something)',
      });

      when(mockedWriter.writeString(anyString())).thenResolve();
      when(mockedWriter.writeString(anyString(), anything())).thenResolve();

      filter.writeFilter(berWriterInstance);

      verify(mockedWriter.writeString(anyString())).times(1);
      verify(mockedWriter.writeString(anyString(), anything())).times(1);
      const writeStringCalls = capture(mockedWriter.writeString);
      writeStringCalls.first().should.deep.equal(['displayName']);
      writeStringCalls.second().should.deep.equal(['My group \\28something\\29', Ber.OctetString]);
    });
  });
});

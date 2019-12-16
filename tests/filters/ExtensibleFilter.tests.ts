import chai from 'chai';
import { BerWriter } from 'asn1';
import {
 anyString, mock, capture, verify, anything, when, instance, reset,
} from 'ts-mockito';
import { ExtensibleFilter } from '../../src/filters';

describe('ExtensibleFilter', () => {
  before(() => {
    chai.should();
  });

  describe('#writeFilter()', () => {
    const mockedWriter: BerWriter = mock(BerWriter);
    const berWriterInstance = instance(mockedWriter);

    before(() => {
      reset(mockedWriter);
    });

    it('should write: userAccountControl:1.2.840.113556.1.4.803:=2', () => {
      const filter = new ExtensibleFilter({
        matchType: 'userAccountControl',
        rule: '1.2.840.113556.1.4.803',
        value: '2',
      });

      when(mockedWriter.writeBoolean(anything())).thenResolve();
      when(mockedWriter.writeString(anyString(), anything())).thenResolve();

      filter.writeFilter(berWriterInstance);

      verify(mockedWriter.writeString(anyString(), anything())).times(3);
      verify(mockedWriter.writeBoolean(anything())).times(0);
      const writeStringCalls = capture(mockedWriter.writeString);
      writeStringCalls.first().should.deep.equal(['1.2.840.113556.1.4.803', 129]);
      writeStringCalls.second().should.deep.equal(['userAccountControl', 130]);
      writeStringCalls.third().should.deep.equal(['2', 131]);
    });
  });
});

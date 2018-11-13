import chai, { should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FilterParser } from '../src/FilterParser';
import { EqualityFilter } from '../src/filters/EqualityFilter';
import { AndFilter } from '../src/filters/AndFilter';
import { SubstringFilter } from '../src/filters/SubstringFilter';
import { LessThanEqualsFilter } from '../src/filters/LessThanEqualsFilter';
import { GreaterThanEqualsFilter } from '../src/filters/GreaterThanEqualsFilter';
import { NotFilter } from '../src/filters/NotFilter';
import { PresenceFilter } from '../src/filters/PresenceFilter';
import { OrFilter } from '../src/filters/OrFilter';
import { ApproximateFilter } from '../src/filters/ApproximateFilter';

describe('FilterParser', () => {
  before(() => {
    chai.should();
    chai.use(chaiAsPromised);
  });

  describe('#parseString()', () => {
    it('should throw for empty filters', () => {
      (() => {
        FilterParser.parseString('');
      }).should.throw(Error, 'Filter cannot be empty');
    });
    it('should throw if parenthesis are unbalanced', () => {
      (() => {
        FilterParser.parseString('(cn=foo');
      }).should.throw(Error, 'Unbalanced parens');
    });
    it('should throw for invalid filter', () => {
      (() => {
        FilterParser.parseString('foo>bar');
      }).should.throw(Error, 'Invalid expression: foo>bar');
    });
    it('should handle non-wrapped filters', () => {
      FilterParser.parseString('cn=foo').should.deep.equal(
        new EqualityFilter({
          attribute: 'cn',
          value: 'foo',
        }),
      );
    });
    it('should throw for nested parenthesis', () => {
      (() => {
        FilterParser.parseString('((cn=foo))');
      }).should.throw(Error, 'Invalid attribute name: (cn=foo');
    });
    it('should allow xml in filter string', () => {
      const result = FilterParser.parseString('(&(CentralUIEnrollments=<mydoc>*)(objectClass=User))');
      result.should.deep.equal(new AndFilter({
        filters: [
          new SubstringFilter({
            attribute: 'CentralUIEnrollments',
            initial: '<mydoc>',
          }),
          new EqualityFilter({
            attribute: 'objectClass',
            value: 'User',
          }),
        ],
      }));
    });
    describe('Special characters in filter string', () => {
      it('should allow = in filter string', () => {
        const result = FilterParser.parseString('(uniquemember=uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc)');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'uniquemember',
          value: 'uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc',
        }));
      });
      it('should allow ( in filter string', () => {
        const result = FilterParser.parseString('foo=bar\\28');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar(',
        }));
      });
      it('should allow ) in filter string', () => {
        const result = FilterParser.parseString('foo=bar\\29');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar)',
        }));
      });
      it('should allow () in filter string', () => {
        const result = FilterParser.parseString('foo=bar\\28\\29');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar()',
        }));
      });
      it('should allow )( in filter string', () => {
        const result = FilterParser.parseString('foo=bar\\29\\28');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar)(',
        }));
      });
      it('should allow )( in filter string', () => {
        const result = FilterParser.parseString('foo=bar\\29\\28');
        result.should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar)(',
        }));
      });
      it('should allow newline as attribute value', () => {
        FilterParser.parseString('(foo=\n)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\n',
        }));
        FilterParser.parseString('(foo<=\n)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\n',
        }));
        FilterParser.parseString('(foo>=\n)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\n',
        }));
        FilterParser.parseString('(foo=\\0a)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\n',
        }));
        FilterParser.parseString('(foo<=\\0a)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\n',
        }));
        FilterParser.parseString('(foo>=\\0a)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\n',
        }));
      });
      it('should allow newline after attribute value', () => {
        FilterParser.parseString('(foo=bar\n)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
        FilterParser.parseString('(foo<=bar\n)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
        FilterParser.parseString('(foo>=bar\n)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
        FilterParser.parseString('(foo=bar\\0a)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
        FilterParser.parseString('(foo<=bar\\0a)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
        FilterParser.parseString('(foo>=bar\\0a)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\n',
        }));
      });
      it('should allow newline before attribute value', () => {
        FilterParser.parseString('(foo=\nbar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
        FilterParser.parseString('(foo<=\nbar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
        FilterParser.parseString('(foo>=\nbar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
        FilterParser.parseString('(foo=\\0abar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
        FilterParser.parseString('(foo<=\\0abar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
        FilterParser.parseString('(foo>=\\0abar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\nbar',
        }));
      });
      it('should allow carriage return as attribute value', () => {
        FilterParser.parseString('(foo=\r)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\r',
        }));
        FilterParser.parseString('(foo<=\r)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\r',
        }));
        FilterParser.parseString('(foo>=\r)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\r',
        }));
        FilterParser.parseString('(foo=\\0d)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\r',
        }));
        FilterParser.parseString('(foo<=\\0d)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\r',
        }));
        FilterParser.parseString('(foo>=\\0d)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\r',
        }));
      });
      it('should allow carriage return after attribute value', () => {
        FilterParser.parseString('(foo=bar\r)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
        FilterParser.parseString('(foo<=bar\r)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
        FilterParser.parseString('(foo>=bar\r)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
        FilterParser.parseString('(foo=bar\\0d)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
        FilterParser.parseString('(foo<=bar\\0d)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
        FilterParser.parseString('(foo>=bar\\0d)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\r',
        }));
      });
      it('should allow carriage return before attribute value', () => {
        FilterParser.parseString('(foo=\rbar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
        FilterParser.parseString('(foo<=\rbar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
        FilterParser.parseString('(foo>=\rbar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
        FilterParser.parseString('(foo=\\0dbar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
        FilterParser.parseString('(foo<=\\0dbar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
        FilterParser.parseString('(foo>=\\0dbar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\rbar',
        }));
      });
      it('should allow tab as attribute value', () => {
        FilterParser.parseString('(foo=\t)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\t',
        }));
        FilterParser.parseString('(foo<=\t)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\t',
        }));
        FilterParser.parseString('(foo>=\t)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\t',
        }));
        FilterParser.parseString('(foo=\\09)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\t',
        }));
        FilterParser.parseString('(foo<=\\09)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\t',
        }));
        FilterParser.parseString('(foo>=\\09)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\t',
        }));
      });
      it('should allow tab after attribute value', () => {
        FilterParser.parseString('(foo=bar\t)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
        FilterParser.parseString('(foo<=bar\t)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
        FilterParser.parseString('(foo>=bar\t)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
        FilterParser.parseString('(foo=bar\\09)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
        FilterParser.parseString('(foo<=bar\\09)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
        FilterParser.parseString('(foo>=bar\\09)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\t',
        }));
      });
      it('should allow tab before attribute value', () => {
        FilterParser.parseString('(foo=\tbar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
        FilterParser.parseString('(foo<=\tbar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
        FilterParser.parseString('(foo>=\tbar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
        FilterParser.parseString('(foo=\\09bar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
        FilterParser.parseString('(foo<=\\09bar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
        FilterParser.parseString('(foo>=\\09bar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\tbar',
        }));
      });
      it('should allow space as attribute value', () => {
        FilterParser.parseString('(foo= )').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: ' ',
        }));
        FilterParser.parseString('(foo<= )').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: ' ',
        }));
        FilterParser.parseString('(foo>= )').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: ' ',
        }));
        FilterParser.parseString('(foo=\\20)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: ' ',
        }));
        FilterParser.parseString('(foo<=\\20)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: ' ',
        }));
        FilterParser.parseString('(foo>=\\20)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: ' ',
        }));
      });
      it('should allow space after attribute value', () => {
        FilterParser.parseString('(foo=bar )').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
        FilterParser.parseString('(foo<=bar )').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
        FilterParser.parseString('(foo>=bar )').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
        FilterParser.parseString('(foo=bar\\20)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
        FilterParser.parseString('(foo<=bar\\20)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
        FilterParser.parseString('(foo>=bar\\20)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar ',
        }));
      });
      it('should allow space before attribute value', () => {
        FilterParser.parseString('(foo= bar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: ' bar',
        }));
        FilterParser.parseString('(foo<= bar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: ' bar',
        }));
        FilterParser.parseString('(foo>= bar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: ' bar',
        }));
        FilterParser.parseString('(foo=\\20bar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: ' bar',
        }));
        FilterParser.parseString('(foo<=\\20bar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: ' bar',
        }));
        FilterParser.parseString('(foo>=\\20bar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: ' bar',
        }));
      });
      it('should allow \\ as attribute value', () => {
        FilterParser.parseString('(foo=\\5c)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\\',
        }));
        FilterParser.parseString('(foo<=\\5c)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\\',
        }));
        FilterParser.parseString('(foo>=\\5c)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\\',
        }));
      });
      it('should allow \\ after attribute value', () => {
        FilterParser.parseString('(foo=bar\\5c)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar\\',
        }));
        FilterParser.parseString('(foo<=bar\\5c)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\\',
        }));
        FilterParser.parseString('(foo>=bar\\5c)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar\\',
        }));
      });
      it('should allow \\ before attribute value', () => {
        FilterParser.parseString('(foo=\\5cbar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '\\bar',
        }));
        FilterParser.parseString('(foo<=\\5cbar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '\\bar',
        }));
        FilterParser.parseString('(foo>=\\5cbar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '\\bar',
        }));
      });
      it('should allow * as attribute value', () => {
        FilterParser.parseString('(foo=\\2a)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '*',
        }));
        FilterParser.parseString('(foo<=\\2a)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '*',
        }));
        FilterParser.parseString('(foo>=\\2a)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '*',
        }));
      });
      it('should allow * after attribute value', () => {
        FilterParser.parseString('(foo=bar\\2a)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: 'bar*',
        }));
        FilterParser.parseString('(foo<=bar\\2a)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: 'bar*',
        }));
        FilterParser.parseString('(foo>=bar\\2a)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: 'bar*',
        }));
      });
      it('should allow * before attribute value', () => {
        FilterParser.parseString('(foo=\\2abar)').should.deep.equal(new EqualityFilter({
          attribute: 'foo',
          value: '*bar',
        }));
        FilterParser.parseString('(foo<=\\2abar)').should.deep.equal(new LessThanEqualsFilter({
          attribute: 'foo',
          value: '*bar',
        }));
        FilterParser.parseString('(foo>=\\2abar)').should.deep.equal(new GreaterThanEqualsFilter({
          attribute: 'foo',
          value: '*bar',
        }));
      });
    });
    describe('SubstringFilter', () => {
      it('should support * with a prefix', () => {
        const result = FilterParser.parseString('(foo=bar*)');
        result.should.deep.equal(new SubstringFilter({
          attribute: 'foo',
          initial: 'bar',
        }));
      });
      it('should support * with a suffix', () => {
        const result = FilterParser.parseString('(foo=*bar)');
        result.should.deep.equal(new SubstringFilter({
          attribute: 'foo',
          final: 'bar',
        }));
      });
      it('should support * with a prefix and escaped *', () => {
        const result = FilterParser.parseString('(foo=bar\\2a*)');
        result.should.deep.equal(new SubstringFilter({
          attribute: 'foo',
          initial: 'bar*',
        }));
      });
      it('should support * with a suffix and escaped *', () => {
        const result = FilterParser.parseString('(foo=*bar\\2a)');
        result.should.deep.equal(new SubstringFilter({
          attribute: 'foo',
          final: 'bar*',
        }));
      });
    });
    describe('NotFilter', () => {
      it('should parse Not filter', () => {
        const result = FilterParser.parseString('(&(objectClass=person)(!(objectClass=shadowAccount)))');
        result.should.deep.equal(new AndFilter({
          filters: [
            new EqualityFilter({
              attribute: 'objectClass',
              value: 'person',
            }),
            new NotFilter({
              filter: new EqualityFilter({
                attribute: 'objectClass',
                value: 'shadowAccount',
              }),
            }),
          ],
        }));
      });
    });
    describe('PresenceFilter', () => {
      it('should parse PresenceFilter', () => {
        const result = FilterParser.parseString('(foo=*)');
        result.should.deep.equal(new PresenceFilter({
          attribute: 'foo',
        }));
      });
    });
    describe('OrFilter', () => {
      it('should parse PresenceFilter', () => {
        const result = FilterParser.parseString('(|(foo=bar)(baz=bip))');
        result.should.deep.equal(new OrFilter({
          filters: [new EqualityFilter({
            attribute: 'foo',
            value: 'bar',
          }), new EqualityFilter({
            attribute: 'baz',
            value: 'bip',
          })],
        }));
      });
    });
    describe('ApproximateFilter', () => {
      it('should parse ApproximateFilter', () => {
        const result = FilterParser.parseString('(foo~=bar)');
        result.should.deep.equal(new ApproximateFilter({
          attribute: 'foo',
          value: 'bar',
        }));
      });
    });
  });
});

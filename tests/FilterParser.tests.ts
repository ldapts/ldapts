import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FilterParser } from '../src/FilterParser';
import {
  AndFilter,
  EqualityFilter,
  ExtensibleFilter,
  SubstringFilter,
  LessThanEqualsFilter,
  GreaterThanEqualsFilter,
  NotFilter,
  PresenceFilter,
  OrFilter,
  ApproximateFilter,
} from '../src/filters';

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
    it('should throw for only parenthesis', () => {
      (() => {
        FilterParser.parseString('()');
      }).should.throw(Error, 'Invalid attribute name:');
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
      describe('paren in value', () => {
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
      });
      describe('newline in value', () => {
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
      });
      describe('tab in value', () => {
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
      });
      describe('space in value', () => {
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
      });
      describe('\\ in value', () => {
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
        it('should allow \\ in attribute value', () => {
          FilterParser.parseString('(foo=\\5cbar\\5cbaz\\5c)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '\\bar\\baz\\',
          }));
          FilterParser.parseString('(foo<=\\5cbar\\5cbaz\\5c)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '\\bar\\baz\\',
          }));
          FilterParser.parseString('(foo>=\\5cbar\\5cbaz\\5c)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '\\bar\\baz\\',
          }));
        });
        it('should allow null (\\00) value in attribute value', () => {
          FilterParser.parseString('(foo=bar\\00)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar\u0000',
          }));
        });
      });
      describe('* in value', () => {
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
        it('should allow * in attribute value', () => {
          FilterParser.parseString('(foo=\\2abar\\2abaz\\2a)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '*bar*baz*',
          }));
          FilterParser.parseString('(foo<=\\2abar\\2abaz\\2a)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '*bar*baz*',
          }));
          FilterParser.parseString('(foo>=\\2abar\\2abaz\\2a)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '*bar*baz*',
          }));
        });
      });
      describe('<= in value', () => {
        it('should allow <= as attribute value', () => {
          FilterParser.parseString('(foo=<=)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '<=',
          }));
          FilterParser.parseString('(foo<=<=)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '<=',
          }));
          FilterParser.parseString('(foo>=<=)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '<=',
          }));
        });
        it('should allow <= after attribute value', () => {
          FilterParser.parseString('(foo=bar<=)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar<=',
          }));
          FilterParser.parseString('(foo<=bar<=)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar<=',
          }));
          FilterParser.parseString('(foo>=bar<=)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar<=',
          }));
        });
        it('should allow <= before attribute value', () => {
          FilterParser.parseString('(foo=<=bar)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '<=bar',
          }));
          FilterParser.parseString('(foo<=<=bar)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '<=bar',
          }));
          FilterParser.parseString('(foo>=<=bar)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '<=bar',
          }));
        });
        it('should allow <= in attribute value', () => {
          FilterParser.parseString('(foo=bar<=baz)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar<=baz',
          }));
          FilterParser.parseString('(foo<=bar<=baz)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar<=baz',
          }));
          FilterParser.parseString('(foo>=bar<=baz)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar<=baz',
          }));
        });
      });
      describe('>= in value', () => {
        it('should allow >= as attribute value', () => {
          FilterParser.parseString('(foo=>=)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '>=',
          }));
          FilterParser.parseString('(foo<=>=)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '>=',
          }));
          FilterParser.parseString('(foo>=>=)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '>=',
          }));
        });
        it('should allow >= after attribute value', () => {
          FilterParser.parseString('(foo=bar>=)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar>=',
          }));
          FilterParser.parseString('(foo<=bar>=)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar>=',
          }));
          FilterParser.parseString('(foo>=bar>=)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar>=',
          }));
        });
        it('should allow >= before attribute value', () => {
          FilterParser.parseString('(foo=>=bar)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '>=bar',
          }));
          FilterParser.parseString('(foo<=>=bar)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '>=bar',
          }));
          FilterParser.parseString('(foo>=>=bar)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '>=bar',
          }));
        });
        it('should allow >= in attribute value', () => {
          FilterParser.parseString('(foo=bar>=baz)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar>=baz',
          }));
          FilterParser.parseString('(foo<=bar>=baz)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar>=baz',
          }));
          FilterParser.parseString('(foo>=bar>=baz)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar>=baz',
          }));
        });
      });
      describe('& in value', () => {
        it('should allow & as attribute value', () => {
          FilterParser.parseString('(foo=&)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '&',
          }));
          FilterParser.parseString('(foo<=&)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '&',
          }));
          FilterParser.parseString('(foo>=&)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '&',
          }));
        });
        it('should allow & after attribute value', () => {
          FilterParser.parseString('(foo=bar&)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar&',
          }));
          FilterParser.parseString('(foo<=bar&)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar&',
          }));
          FilterParser.parseString('(foo>=bar&)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar&',
          }));
        });
        it('should allow & before attribute value', () => {
          FilterParser.parseString('(foo=&bar)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '&bar',
          }));
          FilterParser.parseString('(foo<=&bar)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '&bar',
          }));
          FilterParser.parseString('(foo>=&bar)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '&bar',
          }));
        });
        it('should allow & in attribute value', () => {
          FilterParser.parseString('(foo=&bar&baz&)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '&bar&baz&',
          }));
          FilterParser.parseString('(foo<=&bar&baz&)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '&bar&baz&',
          }));
          FilterParser.parseString('(foo>=&bar&baz&)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '&bar&baz&',
          }));
        });
      });
      describe('| in value', () => {
        it('should allow | as attribute value', () => {
          FilterParser.parseString('(foo=|)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '|',
          }));
          FilterParser.parseString('(foo<=|)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '|',
          }));
          FilterParser.parseString('(foo>=|)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '|',
          }));
        });
        it('should allow | after attribute value', () => {
          FilterParser.parseString('(foo=bar|)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar|',
          }));
          FilterParser.parseString('(foo<=bar|)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar|',
          }));
          FilterParser.parseString('(foo>=bar|)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar|',
          }));
        });
        it('should allow | before attribute value', () => {
          FilterParser.parseString('(foo=|bar)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '|bar',
          }));
          FilterParser.parseString('(foo<=|bar)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '|bar',
          }));
          FilterParser.parseString('(foo>=|bar)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '|bar',
          }));
        });
        it('should allow | in attribute value', () => {
          FilterParser.parseString('(foo=|bar|baz|)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '|bar|baz|',
          }));
          FilterParser.parseString('(foo<=|bar|baz|)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '|bar|baz|',
          }));
          FilterParser.parseString('(foo>=|bar|baz|)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '|bar|baz|',
          }));
        });
      });
      describe('! in value', () => {
        it('should allow ! as attribute value', () => {
          FilterParser.parseString('(foo=!)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '!',
          }));
          FilterParser.parseString('(foo<=!)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '!',
          }));
          FilterParser.parseString('(foo>=!)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '!',
          }));
        });
        it('should allow ! after attribute value', () => {
          FilterParser.parseString('(foo=bar!)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'bar!',
          }));
          FilterParser.parseString('(foo<=bar!)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'bar!',
          }));
          FilterParser.parseString('(foo>=bar!)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'bar!',
          }));
        });
        it('should allow ! before attribute value', () => {
          FilterParser.parseString('(foo=!bar)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '!bar',
          }));
          FilterParser.parseString('(foo<=!bar)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '!bar',
          }));
          FilterParser.parseString('(foo>=!bar)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '!bar',
          }));
        });
        it('should allow ! in attribute value', () => {
          FilterParser.parseString('(foo=!bar!baz!)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '!bar!baz!',
          }));
          FilterParser.parseString('(foo<=!bar!baz!)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '!bar!baz!',
          }));
          FilterParser.parseString('(foo>=!bar!baz!)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '!bar!baz!',
          }));
        });
      });
      describe('unicode in value', () => {
        it('should allow ☕⛵ᄨ as attribute value', () => {
          FilterParser.parseString('(foo=☕⛵ᄨ)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: '☕⛵ᄨ',
          }));
          FilterParser.parseString('(foo<=☕⛵ᄨ)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: '☕⛵ᄨ',
          }));
          FilterParser.parseString('(foo>=☕⛵ᄨ)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: '☕⛵ᄨ',
          }));
        });
        it('should allow ᎢᏣᎵᏍᎠᏁᏗ as attribute value', () => {
          FilterParser.parseString('(foo=ᎢᏣᎵᏍᎠᏁᏗ)').should.deep.equal(new EqualityFilter({
            attribute: 'foo',
            value: 'ᎢᏣᎵᏍᎠᏁᏗ',
          }));
          FilterParser.parseString('(foo<=ᎢᏣᎵᏍᎠᏁᏗ)').should.deep.equal(new LessThanEqualsFilter({
            attribute: 'foo',
            value: 'ᎢᏣᎵᏍᎠᏁᏗ',
          }));
          FilterParser.parseString('(foo>=ᎢᏣᎵᏍᎠᏁᏗ)').should.deep.equal(new GreaterThanEqualsFilter({
            attribute: 'foo',
            value: 'ᎢᏣᎵᏍᎠᏁᏗ',
          }));
        });
      });
      describe('Tests from RFC examples', () => {
        it('should parse: (o=Parens R Us (for all your parenthetical needs))', () => {
          const result = FilterParser.parseString('(o=Parens R Us \\28for all your parenthetical needs\\29)');
          result.should.deep.equal(new EqualityFilter({
            attribute: 'o',
            value: 'Parens R Us (for all your parenthetical needs)',
          }));
        });
        it('should parse: (cn=***)', () => {
          const result = FilterParser.parseString('(cn=*\\2A*)');
          result.should.deep.equal(new SubstringFilter({
            attribute: 'cn',
            any: ['*'],
          }));
        });
        it('should parse: (&(objectCategory=group)(displayName=My group (something)))', () => {
          const result = FilterParser.parseString('(&(objectCategory=group)(displayName=My group \\28something\\29))');
          result.should.deep.equal(new AndFilter({
            filters: [
              new EqualityFilter({
                attribute: 'objectCategory',
                value: 'group',
              }),
              new EqualityFilter({
                attribute: 'displayName',
                value: 'My group (something)',
              }),
            ],
          }));
        });
      });
    });
    describe('Github Issues', () => {
      it('should parse: (&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))', () => {
        const result = FilterParser.parseString('(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
        result.should.deep.equal(new AndFilter({
          filters: [
            new EqualityFilter({
              attribute: 'objectCategory',
              value: 'person',
            }),
            new EqualityFilter({
              attribute: 'objectClass',
              value: 'user',
            }),
            new NotFilter({
              filter: new ExtensibleFilter({
                matchType: 'userAccountControl',
                rule: '1.2.840.113556.1.4.803',
                value: '2',
              }),
            }),
          ],
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
    describe('ExtensibleFilter', () => {
      it('should parse: (cn:caseExactMatch:=Fred Flintstone)', () => {
        const result = FilterParser.parseString('(cn:caseExactMatch:=Fred Flintstone)');
        result.should.deep.equal(new ExtensibleFilter({
          matchType: 'cn',
          rule: 'caseExactMatch',
          value: 'Fred Flintstone',
        }));
      });
      it('should parse: (cn:=Betty Rubble)', () => {
        const result = FilterParser.parseString('(cn:=Betty Rubble)');
        result.should.deep.equal(new ExtensibleFilter({
          matchType: 'cn',
          value: 'Betty Rubble',
        }));
      });
      it('should parse: (sn:dn:2.4.6.8.10:=Barney Rubble)', () => {
        const result = FilterParser.parseString('(sn:dn:2.4.6.8.10:=Barney Rubble)');
        result.should.deep.equal(new ExtensibleFilter({
          matchType: 'sn',
          rule: '2.4.6.8.10',
          dnAttributes: true,
          value: 'Barney Rubble',
        }));
      });
      it('should parse: (o:dn:=Ace Industry)', () => {
        const result = FilterParser.parseString('(o:dn:=Ace Industry)');
        result.should.deep.equal(new ExtensibleFilter({
          matchType: 'o',
          dnAttributes: true,
          value: 'Ace Industry',
        }));
      });
      it('should parse: (:1.2.3:=Wilma Flintstone)', () => {
        const result = FilterParser.parseString('(:1.2.3:=Wilma Flintstone)');
        result.should.deep.equal(new ExtensibleFilter({
          rule: '1.2.3',
          value: 'Wilma Flintstone',
        }));
      });
      it('should parse: (:DN:2.4.6.8.10:=Dino)', () => {
        const result = FilterParser.parseString('(:DN:2.4.6.8.10:=Dino)');
        result.should.deep.equal(new ExtensibleFilter({
          rule: '2.4.6.8.10',
          dnAttributes: true,
          value: 'Dino',
        }));
      });
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  AndFilter,
  ApproximateFilter,
  EqualityFilter,
  ExtensibleFilter,
  FilterParser,
  GreaterThanEqualsFilter,
  LessThanEqualsFilter,
  NotFilter,
  OrFilter,
  PresenceFilter,
  SubstringFilter,
} from '../src/index.js';

describe('FilterParser', () => {
  describe('#parseString()', () => {
    it('should throw for empty filters', () => {
      expect((): void => {
        FilterParser.parseString('');
      }).toThrow('Filter cannot be empty');
    });

    it('should throw if parenthesis are unbalanced', () => {
      expect((): void => {
        FilterParser.parseString('(cn=foo');
      }).toThrow('Unbalanced parens');
    });

    it('should throw for invalid filter', () => {
      expect((): void => {
        FilterParser.parseString('foo>bar');
      }).toThrow('Invalid expression: foo>bar');
    });

    it('should handle non-wrapped filters', () => {
      expect(FilterParser.parseString('cn=foo')).toStrictEqual(
        new EqualityFilter({
          attribute: 'cn',
          value: 'foo',
        }),
      );
    });

    it('should throw for only parenthesis', () => {
      expect((): void => {
        FilterParser.parseString('()');
      }).toThrow('Invalid attribute name:');
    });

    it('should throw for nested parenthesis', () => {
      expect((): void => {
        FilterParser.parseString('((cn=foo))');
      }).toThrow('Invalid attribute name: (cn=foo');
    });

    it('should allow xml in filter string', () => {
      const result = FilterParser.parseString('(&(CentralUIEnrollments=<mydoc>*)(objectClass=User))');
      expect(result).toStrictEqual(
        new AndFilter({
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
        }),
      );
    });

    describe('Special characters in filter string', () => {
      it('should allow = in filter string', () => {
        const result = FilterParser.parseString('(uniquemember=uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc)');
        expect(result).toStrictEqual(
          new EqualityFilter({
            attribute: 'uniquemember',
            value: 'uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc',
          }),
        );
      });

      describe('paren in value', () => {
        it('should allow ( in filter string', () => {
          const result = FilterParser.parseString('foo=bar\\28');
          expect(result).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar(',
            }),
          );
        });

        it('should allow ) in filter string', () => {
          const result = FilterParser.parseString('foo=bar\\29');
          expect(result).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar)',
            }),
          );
        });

        it('should allow () in filter string', () => {
          const result = FilterParser.parseString('foo=bar\\28\\29');
          expect(result).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar()',
            }),
          );
        });

        it('should allow )( in filter string', () => {
          const result = FilterParser.parseString('foo=bar\\29\\28');
          expect(result).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar)(',
            }),
          );
        });
      });

      describe('newline in value', () => {
        it('should allow newline as attribute value', () => {
          expect(FilterParser.parseString('(foo=\n)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
          expect(FilterParser.parseString('(foo<=\n)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
          expect(FilterParser.parseString('(foo>=\n)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
          expect(FilterParser.parseString('(foo=\\0a)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\0a)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\0a)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\n',
            }),
          );
        });

        it('should allow newline after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\n)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\n)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\n)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
          expect(FilterParser.parseString('(foo=bar\\0a)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\0a)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\0a)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\n',
            }),
          );
        });

        it('should allow newline before attribute value', () => {
          expect(FilterParser.parseString('(foo=\nbar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\nbar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\nbar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
          expect(FilterParser.parseString('(foo=\\0abar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\0abar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\0abar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\nbar',
            }),
          );
        });

        it('should allow carriage return as attribute value', () => {
          expect(FilterParser.parseString('(foo=\r)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
          expect(FilterParser.parseString('(foo<=\r)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
          expect(FilterParser.parseString('(foo>=\r)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
          expect(FilterParser.parseString('(foo=\\0d)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\0d)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\0d)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\r',
            }),
          );
        });

        it('should allow carriage return after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\r)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\r)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\r)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
          expect(FilterParser.parseString('(foo=bar\\0d)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\0d)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\0d)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\r',
            }),
          );
        });

        it('should allow carriage return before attribute value', () => {
          expect(FilterParser.parseString('(foo=\rbar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\rbar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\rbar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
          expect(FilterParser.parseString('(foo=\\0dbar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\0dbar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\0dbar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\rbar',
            }),
          );
        });
      });

      describe('tab in value', () => {
        it('should allow tab as attribute value', () => {
          expect(FilterParser.parseString('(foo=\t)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
          expect(FilterParser.parseString('(foo<=\t)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
          expect(FilterParser.parseString('(foo>=\t)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
          expect(FilterParser.parseString('(foo=\\09)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\09)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\09)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\t',
            }),
          );
        });

        it('should allow tab after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\t)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\t)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\t)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
          expect(FilterParser.parseString('(foo=bar\\09)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\09)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\09)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\t',
            }),
          );
        });

        it('should allow tab before attribute value', () => {
          expect(FilterParser.parseString('(foo=\tbar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\tbar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\tbar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
          expect(FilterParser.parseString('(foo=\\09bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\09bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\09bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\tbar',
            }),
          );
        });
      });

      describe('space in value', () => {
        it('should allow space as attribute value', () => {
          expect(FilterParser.parseString('(foo= )')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
          expect(FilterParser.parseString('(foo<= )')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
          expect(FilterParser.parseString('(foo>= )')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
          expect(FilterParser.parseString('(foo=\\20)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\20)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\20)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: ' ',
            }),
          );
        });

        it('should allow space after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar )')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar )')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar )')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
          expect(FilterParser.parseString('(foo=bar\\20)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\20)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\20)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar ',
            }),
          );
        });

        it('should allow space before attribute value', () => {
          expect(FilterParser.parseString('(foo= bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
          expect(FilterParser.parseString('(foo<= bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
          expect(FilterParser.parseString('(foo>= bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
          expect(FilterParser.parseString('(foo=\\20bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\20bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\20bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: ' bar',
            }),
          );
        });
      });

      describe('\\ in value', () => {
        it('should allow \\ as attribute value', () => {
          expect(FilterParser.parseString('(foo=\\5c)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\\',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\5c)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\\',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\5c)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\\',
            }),
          );
        });

        it('should allow \\ after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\\5c)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\\',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\5c)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\\',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\5c)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar\\',
            }),
          );
        });

        it('should allow \\ before attribute value', () => {
          expect(FilterParser.parseString('(foo=\\5cbar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\\bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\5cbar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\\bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\5cbar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\\bar',
            }),
          );
        });

        it('should allow \\ in attribute value', () => {
          expect(FilterParser.parseString('(foo=\\5cbar\\5cbaz\\5c)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '\\bar\\baz\\',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\5cbar\\5cbaz\\5c)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '\\bar\\baz\\',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\5cbar\\5cbaz\\5c)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '\\bar\\baz\\',
            }),
          );
        });

        it('should allow null (\\00) value in attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\\00)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar\u0000',
            }),
          );
        });
      });

      describe('* in value', () => {
        it('should allow * as attribute value', () => {
          expect(FilterParser.parseString('(foo=\\2a)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '*',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\2a)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '*',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\2a)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '*',
            }),
          );
        });

        it('should allow * after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar\\2a)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar*',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar\\2a)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar*',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar\\2a)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar*',
            }),
          );
        });

        it('should allow * before attribute value', () => {
          expect(FilterParser.parseString('(foo=\\2abar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '*bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\2abar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '*bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\2abar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '*bar',
            }),
          );
        });

        it('should allow * in attribute value', () => {
          expect(FilterParser.parseString('(foo=\\2abar\\2abaz\\2a)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '*bar*baz*',
            }),
          );
          expect(FilterParser.parseString('(foo<=\\2abar\\2abaz\\2a)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '*bar*baz*',
            }),
          );
          expect(FilterParser.parseString('(foo>=\\2abar\\2abaz\\2a)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '*bar*baz*',
            }),
          );
        });
      });

      describe('<= in value', () => {
        it('should allow <= as attribute value', () => {
          expect(FilterParser.parseString('(foo=<=)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '<=',
            }),
          );
          expect(FilterParser.parseString('(foo<=<=)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '<=',
            }),
          );
          expect(FilterParser.parseString('(foo>=<=)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '<=',
            }),
          );
        });

        it('should allow <= after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar<=)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar<=',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar<=)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar<=',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar<=)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar<=',
            }),
          );
        });

        it('should allow <= before attribute value', () => {
          expect(FilterParser.parseString('(foo=<=bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '<=bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=<=bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '<=bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=<=bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '<=bar',
            }),
          );
        });

        it('should allow <= in attribute value', () => {
          expect(FilterParser.parseString('(foo=bar<=baz)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar<=baz',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar<=baz)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar<=baz',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar<=baz)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar<=baz',
            }),
          );
        });
      });

      describe('>= in value', () => {
        it('should allow >= as attribute value', () => {
          expect(FilterParser.parseString('(foo=>=)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '>=',
            }),
          );
          expect(FilterParser.parseString('(foo<=>=)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '>=',
            }),
          );
          expect(FilterParser.parseString('(foo>=>=)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '>=',
            }),
          );
        });

        it('should allow >= after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar>=)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar>=',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar>=)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar>=',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar>=)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar>=',
            }),
          );
        });

        it('should allow >= before attribute value', () => {
          expect(FilterParser.parseString('(foo=>=bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '>=bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=>=bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '>=bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=>=bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '>=bar',
            }),
          );
        });

        it('should allow >= in attribute value', () => {
          expect(FilterParser.parseString('(foo=bar>=baz)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar>=baz',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar>=baz)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar>=baz',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar>=baz)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar>=baz',
            }),
          );
        });
      });

      describe('& in value', () => {
        it('should allow & as attribute value', () => {
          expect(FilterParser.parseString('(foo=&)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '&',
            }),
          );
          expect(FilterParser.parseString('(foo<=&)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '&',
            }),
          );
          expect(FilterParser.parseString('(foo>=&)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '&',
            }),
          );
        });

        it('should allow & after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar&)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar&',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar&)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar&',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar&)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar&',
            }),
          );
        });

        it('should allow & before attribute value', () => {
          expect(FilterParser.parseString('(foo=&bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '&bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=&bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '&bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=&bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '&bar',
            }),
          );
        });

        it('should allow & in attribute value', () => {
          expect(FilterParser.parseString('(foo=&bar&baz&)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '&bar&baz&',
            }),
          );
          expect(FilterParser.parseString('(foo<=&bar&baz&)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '&bar&baz&',
            }),
          );
          expect(FilterParser.parseString('(foo>=&bar&baz&)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '&bar&baz&',
            }),
          );
        });
      });

      describe('| in value', () => {
        it('should allow | as attribute value', () => {
          expect(FilterParser.parseString('(foo=|)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '|',
            }),
          );
          expect(FilterParser.parseString('(foo<=|)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '|',
            }),
          );
          expect(FilterParser.parseString('(foo>=|)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '|',
            }),
          );
        });

        it('should allow | after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar|)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar|',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar|)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar|',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar|)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar|',
            }),
          );
        });

        it('should allow | before attribute value', () => {
          expect(FilterParser.parseString('(foo=|bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '|bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=|bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '|bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=|bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '|bar',
            }),
          );
        });

        it('should allow | in attribute value', () => {
          expect(FilterParser.parseString('(foo=|bar|baz|)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '|bar|baz|',
            }),
          );
          expect(FilterParser.parseString('(foo<=|bar|baz|)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '|bar|baz|',
            }),
          );
          expect(FilterParser.parseString('(foo>=|bar|baz|)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '|bar|baz|',
            }),
          );
        });
      });

      describe('! in value', () => {
        it('should allow ! as attribute value', () => {
          expect(FilterParser.parseString('(foo=!)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '!',
            }),
          );
          expect(FilterParser.parseString('(foo<=!)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '!',
            }),
          );
          expect(FilterParser.parseString('(foo>=!)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '!',
            }),
          );
        });

        it('should allow ! after attribute value', () => {
          expect(FilterParser.parseString('(foo=bar!)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'bar!',
            }),
          );
          expect(FilterParser.parseString('(foo<=bar!)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'bar!',
            }),
          );
          expect(FilterParser.parseString('(foo>=bar!)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'bar!',
            }),
          );
        });

        it('should allow ! before attribute value', () => {
          expect(FilterParser.parseString('(foo=!bar)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '!bar',
            }),
          );
          expect(FilterParser.parseString('(foo<=!bar)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '!bar',
            }),
          );
          expect(FilterParser.parseString('(foo>=!bar)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '!bar',
            }),
          );
        });

        it('should allow ! in attribute value', () => {
          expect(FilterParser.parseString('(foo=!bar!baz!)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '!bar!baz!',
            }),
          );
          expect(FilterParser.parseString('(foo<=!bar!baz!)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '!bar!baz!',
            }),
          );
          expect(FilterParser.parseString('(foo>=!bar!baz!)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '!bar!baz!',
            }),
          );
        });
      });

      describe('unicode in value', () => {
        it('should allow ☕⛵ᄨ as attribute value', () => {
          expect(FilterParser.parseString('(foo=☕⛵ᄨ)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: '☕⛵ᄨ',
            }),
          );
          expect(FilterParser.parseString('(foo<=☕⛵ᄨ)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: '☕⛵ᄨ',
            }),
          );
          expect(FilterParser.parseString('(foo>=☕⛵ᄨ)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: '☕⛵ᄨ',
            }),
          );
        });

        it('should allow ᎢᏣᎵᏍᎠᏁᏗ as attribute value', () => {
          expect(FilterParser.parseString('(foo=ᎢᏣᎵᏍᎠᏁᏗ)')).toStrictEqual(
            new EqualityFilter({
              attribute: 'foo',
              value: 'ᎢᏣᎵᏍᎠᏁᏗ',
            }),
          );
          expect(FilterParser.parseString('(foo<=ᎢᏣᎵᏍᎠᏁᏗ)')).toStrictEqual(
            new LessThanEqualsFilter({
              attribute: 'foo',
              value: 'ᎢᏣᎵᏍᎠᏁᏗ',
            }),
          );
          expect(FilterParser.parseString('(foo>=ᎢᏣᎵᏍᎠᏁᏗ)')).toStrictEqual(
            new GreaterThanEqualsFilter({
              attribute: 'foo',
              value: 'ᎢᏣᎵᏍᎠᏁᏗ',
            }),
          );
        });
      });

      describe('Tests from RFC examples', () => {
        it('should parse: (o=Parens R Us (for all your parenthetical needs))', () => {
          const result = FilterParser.parseString('(o=Parens R Us \\28for all your parenthetical needs\\29)');
          expect(result).toStrictEqual(
            new EqualityFilter({
              attribute: 'o',
              value: 'Parens R Us (for all your parenthetical needs)',
            }),
          );
        });

        it('should parse: (cn=***)', () => {
          const result = FilterParser.parseString('(cn=*\\2A*)');
          expect(result).toStrictEqual(
            new SubstringFilter({
              attribute: 'cn',
              any: ['*'],
            }),
          );
        });

        it('should parse: (&(objectCategory=group)(displayName=My group (something)))', () => {
          const result = FilterParser.parseString('(&(objectCategory=group)(displayName=My group \\28something\\29))');
          expect(result).toStrictEqual(
            new AndFilter({
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
            }),
          );
        });
      });
    });

    describe('Github Issues', () => {
      it('should parse: (&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))', () => {
        const result = FilterParser.parseString('(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
        expect(result).toStrictEqual(
          new AndFilter({
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
          }),
        );
      });
    });

    describe('SubstringFilter', () => {
      it('should support * with a prefix', () => {
        const result = FilterParser.parseString('(foo=bar*)');
        expect(result).toStrictEqual(
          new SubstringFilter({
            attribute: 'foo',
            initial: 'bar',
          }),
        );
      });

      it('should support * with a suffix', () => {
        const result = FilterParser.parseString('(foo=*bar)');
        expect(result).toStrictEqual(
          new SubstringFilter({
            attribute: 'foo',
            final: 'bar',
          }),
        );
      });

      it('should support * with a prefix and escaped *', () => {
        const result = FilterParser.parseString('(foo=bar\\2a*)');
        expect(result).toStrictEqual(
          new SubstringFilter({
            attribute: 'foo',
            initial: 'bar*',
          }),
        );
      });

      it('should support * with a suffix and escaped *', () => {
        const result = FilterParser.parseString('(foo=*bar\\2a)');
        expect(result).toStrictEqual(
          new SubstringFilter({
            attribute: 'foo',
            final: 'bar*',
          }),
        );
      });
    });

    describe('NotFilter', () => {
      it('should parse Not filter', () => {
        const result = FilterParser.parseString('(&(objectClass=person)(!(objectClass=shadowAccount)))');
        expect(result).toStrictEqual(
          new AndFilter({
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
          }),
        );
      });
    });

    describe('PresenceFilter', () => {
      it('should parse PresenceFilter', () => {
        const result = FilterParser.parseString('(foo=*)');
        expect(result).toStrictEqual(
          new PresenceFilter({
            attribute: 'foo',
          }),
        );
      });
    });

    describe('OrFilter', () => {
      it('should parse PresenceFilter', () => {
        const result = FilterParser.parseString('(|(foo=bar)(baz=bip))');
        expect(result).toStrictEqual(
          new OrFilter({
            filters: [
              new EqualityFilter({
                attribute: 'foo',
                value: 'bar',
              }),
              new EqualityFilter({
                attribute: 'baz',
                value: 'bip',
              }),
            ],
          }),
        );
      });
    });

    describe('ApproximateFilter', () => {
      it('should parse ApproximateFilter', () => {
        const result = FilterParser.parseString('(foo~=bar)');
        expect(result).toStrictEqual(
          new ApproximateFilter({
            attribute: 'foo',
            value: 'bar',
          }),
        );
      });
    });

    describe('ExtensibleFilter', () => {
      it('should parse: (cn:caseExactMatch:=Fred Flintstone)', () => {
        const result = FilterParser.parseString('(cn:caseExactMatch:=Fred Flintstone)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            matchType: 'cn',
            rule: 'caseExactMatch',
            value: 'Fred Flintstone',
          }),
        );
      });

      it('should parse: (cn:=Betty Rubble)', () => {
        const result = FilterParser.parseString('(cn:=Betty Rubble)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            matchType: 'cn',
            value: 'Betty Rubble',
          }),
        );
      });

      it('should parse: (sn:dn:2.4.6.8.10:=Barney Rubble)', () => {
        const result = FilterParser.parseString('(sn:dn:2.4.6.8.10:=Barney Rubble)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            matchType: 'sn',
            rule: '2.4.6.8.10',
            dnAttributes: true,
            value: 'Barney Rubble',
          }),
        );
      });

      it('should parse: (o:dn:=Ace Industry)', () => {
        const result = FilterParser.parseString('(o:dn:=Ace Industry)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            matchType: 'o',
            dnAttributes: true,
            value: 'Ace Industry',
          }),
        );
      });

      it('should parse: (:1.2.3:=Wilma Flintstone)', () => {
        const result = FilterParser.parseString('(:1.2.3:=Wilma Flintstone)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            rule: '1.2.3',
            value: 'Wilma Flintstone',
          }),
        );
      });

      it('should parse: (:DN:2.4.6.8.10:=Dino)', () => {
        const result = FilterParser.parseString('(:DN:2.4.6.8.10:=Dino)');
        expect(result).toStrictEqual(
          new ExtensibleFilter({
            rule: '2.4.6.8.10',
            dnAttributes: true,
            value: 'Dino',
          }),
        );
      });
    });
  });
});

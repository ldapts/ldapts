import type { BerReader } from 'asn1';

import type { ExtensibleFilterOptions } from './filters/ExtensibleFilter.js';
import type { Filter } from './filters/Filter.js';
import {
  AndFilter,
  ApproximateFilter,
  EqualityFilter,
  ExtensibleFilter,
  GreaterThanEqualsFilter,
  LessThanEqualsFilter,
  NotFilter,
  OrFilter,
  PresenceFilter,
  SubstringFilter,
} from './filters/index.js';
import { SearchFilter } from './SearchFilter.js';

interface ParseStringResult {
  end: number;
  filter: Filter;
}

interface Substring {
  initial: string;
  any: string[];
  final: string;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FilterParser {
  public static parseString(filterString: string): Filter {
    if (!filterString) {
      throw new Error('Filter cannot be empty');
    }

    // Wrap input in parens if it wasn't already
    if (!filterString.startsWith('(')) {
      filterString = `(${filterString})`;
    }

    const parseResult = FilterParser._parseString(filterString, 0, filterString);
    const end = filterString.length - 1;
    if (parseResult.end < end) {
      throw new Error(`Unbalanced parens in filter string: ${filterString}`);
    }

    return parseResult.filter;
  }

  /*
   * A filter looks like this coming in:
   *      Filter ::= CHOICE {
   *              and             [0]     SET OF Filter,
   *              or              [1]     SET OF Filter,
   *              not             [2]     Filter,
   *              equalityMatch   [3]     AttributeValueAssertion,
   *              substrings      [4]     SubstringFilter,
   *              greaterOrEqual  [5]     AttributeValueAssertion,
   *              lessOrEqual     [6]     AttributeValueAssertion,
   *              present         [7]     AttributeType,
   *              approxMatch     [8]     AttributeValueAssertion,
   *              extensibleMatch [9]     MatchingRuleAssertion --v3 only
   *      }
   *
   *      SubstringFilter ::= SEQUENCE {
   *              type               AttributeType,
   *              SEQUENCE OF CHOICE {
   *                      initial          [0] IA5String,
   *                      any              [1] IA5String,
   *                      final            [2] IA5String
   *              }
   *      }
   *
   * The extensibleMatch was added in LDAPv3:
   *
   *      MatchingRuleAssertion ::= SEQUENCE {
   *              matchingRule    [1] MatchingRuleID OPTIONAL,
   *              type            [2] AttributeDescription OPTIONAL,
   *              matchValue      [3] AssertionValue,
   *              dnAttributes    [4] BOOLEAN DEFAULT FALSE
   *      }
   */
  public static parse(reader: BerReader): Filter {
    const type: number | null = reader.readSequence();

    let filter: Filter;

    switch (type) {
      case SearchFilter.and: {
        const andFilters = FilterParser._parseSet(reader);
        filter = new AndFilter({
          filters: andFilters,
        });
        break;
      }

      case SearchFilter.approxMatch:
        filter = new ApproximateFilter();
        filter.parse(reader);
        break;
      case SearchFilter.equalityMatch:
        filter = new EqualityFilter();
        filter.parse(reader);
        break;
      case SearchFilter.extensibleMatch:
        filter = new ExtensibleFilter();
        filter.parse(reader);
        break;
      case SearchFilter.greaterOrEqual:
        filter = new GreaterThanEqualsFilter();
        filter.parse(reader);
        break;
      case SearchFilter.lessOrEqual:
        filter = new LessThanEqualsFilter();
        filter.parse(reader);
        break;
      case SearchFilter.not: {
        const innerFilter = FilterParser.parse(reader);
        filter = new NotFilter({
          filter: innerFilter,
        });
        break;
      }

      case SearchFilter.or: {
        const orFilters = FilterParser._parseSet(reader);
        filter = new OrFilter({
          filters: orFilters,
        });
        break;
      }

      case SearchFilter.present:
        filter = new PresenceFilter();
        filter.parse(reader);
        break;
      case SearchFilter.substrings:
        filter = new SubstringFilter();
        filter.parse(reader);
        break;
      default:
        throw new Error(`Invalid search filter type: 0x${type ?? '<null>'}`);
    }

    return filter;
  }

  private static _parseString(filterString: string, start: number, fullString: string): ParseStringResult {
    let cursor = start;
    const { length } = filterString;
    let filter: Filter;

    if (filterString[cursor] !== '(') {
      throw new Error(`Missing paren: ${filterString}. Full string: ${fullString}`);
    }

    cursor += 1;

    switch (filterString[cursor]) {
      case '&': {
        cursor += 1;
        const children: Filter[] = [];
        do {
          const childResult = FilterParser._parseString(filterString, cursor, fullString);
          children.push(childResult.filter);
          cursor = childResult.end + 1;
        } while (cursor < length && filterString[cursor] !== ')');

        filter = new AndFilter({
          filters: children,
        });

        break;
      }

      case '|': {
        cursor += 1;
        const children: Filter[] = [];
        do {
          const childResult = FilterParser._parseString(filterString, cursor, fullString);
          children.push(childResult.filter);
          cursor = childResult.end + 1;
        } while (cursor < length && filterString[cursor] !== ')');

        filter = new OrFilter({
          filters: children,
        });

        break;
      }

      case '!': {
        const childResult = FilterParser._parseString(filterString, cursor + 1, fullString);
        filter = new NotFilter({
          filter: childResult.filter,
        });
        cursor = childResult.end + 1;

        break;
      }

      default: {
        const end = filterString.indexOf(')', cursor);
        if (end === -1) {
          throw new Error(`Unbalanced parens: ${filterString}. Full string: ${fullString}`);
        }

        filter = FilterParser._parseExpressionFilterFromString(filterString.substring(cursor, end));
        cursor = end;
      }
    }

    return {
      end: cursor,
      filter,
    };
  }

  private static _parseExpressionFilterFromString(filterString: string): Filter {
    let attribute: string;
    let remainingExpression: string;

    if (filterString.startsWith(':')) {
      // An extensible filter can have no attribute name (Only valid when using dn and * matching-rule evaluation)
      attribute = '';
      remainingExpression = filterString;
    } else {
      const matches = /^[\w-]+/.exec(filterString);
      if (matches?.length) {
        [attribute] = matches;
        remainingExpression = filterString.slice(attribute.length);
      } else {
        throw new Error(`Invalid attribute name: ${filterString}`);
      }
    }

    if (remainingExpression === '=*') {
      return new PresenceFilter({
        attribute,
      });
    }

    if (remainingExpression.startsWith('=')) {
      remainingExpression = remainingExpression.slice(1);
      if (remainingExpression.includes('*')) {
        const escapedExpression = FilterParser._unescapeSubstring(remainingExpression);
        return new SubstringFilter({
          attribute,
          initial: escapedExpression.initial,
          any: escapedExpression.any,
          final: escapedExpression.final,
        });
      }

      return new EqualityFilter({
        attribute,
        value: FilterParser._unescapeHexValues(remainingExpression),
      });
    }

    if (remainingExpression.startsWith('>') && remainingExpression[1] === '=') {
      return new GreaterThanEqualsFilter({
        attribute,
        value: FilterParser._unescapeHexValues(remainingExpression.slice(2)),
      });
    }

    if (remainingExpression.startsWith('<') && remainingExpression[1] === '=') {
      return new LessThanEqualsFilter({
        attribute,
        value: FilterParser._unescapeHexValues(remainingExpression.slice(2)),
      });
    }

    if (remainingExpression.startsWith('~') && remainingExpression[1] === '=') {
      return new ApproximateFilter({
        attribute,
        value: FilterParser._unescapeHexValues(remainingExpression.slice(2)),
      });
    }

    if (remainingExpression.startsWith(':')) {
      return FilterParser._parseExtensibleFilterFromString(attribute, remainingExpression);
    }

    throw new Error(`Invalid expression: ${filterString}`);
  }

  private static _parseExtensibleFilterFromString(attribute: string, filterString: string): ExtensibleFilter {
    let dnAttributes = false;
    let rule: string | undefined;

    const fields = filterString.split(':');
    if (fields.length <= 1) {
      throw new Error(`Invalid extensible filter: ${filterString}`);
    }

    // Remove first entry, since it should be empty
    fields.shift();

    if (fields[0]?.toLowerCase() === 'dn') {
      dnAttributes = true;
      fields.shift();
    }

    if (fields.length && !fields[0]?.startsWith('=')) {
      rule = fields.shift();
    }

    if (fields.length && !fields[0]?.startsWith('=')) {
      throw new Error(`Missing := in extensible filter: ${filterString}`);
    }

    // Trim the leading = (from the :=) and reinsert any extra ':' characters
    const remainingExpression = fields.join(':').slice(1);
    const options: ExtensibleFilterOptions = {
      matchType: attribute,
      dnAttributes,
      rule,
      value: FilterParser._unescapeHexValues(remainingExpression),
    };

    // TODO: Enable this if it's useful
    // if (remainingExpression.indexOf('*') !== -1) {
    //   const substring = FilterParser._escapeSubstring(remainingExpression);
    //   options.initial = substring.initial;
    //   options.any = substring.any;
    //   options.final = substring.final;
    // }

    return new ExtensibleFilter(options);
  }

  private static _unescapeHexValues(input: string): string {
    let index = 0;
    const end = input.length;
    let result = '';

    while (index < end) {
      const char = input[index];

      switch (char) {
        case '(':
          throw new Error(`Illegal unescaped character: ${char} in value: ${input}`);
        case '\\': {
          const value = input.slice(index + 1, index + 3);
          if (/^[\dA-Fa-f]{2}$/.exec(value) === null) {
            throw new Error(`Invalid escaped hex character: ${value} in value: ${input}`);
          }

          result += String.fromCharCode(Number.parseInt(value, 16));
          index += 3;

          break;
        }

        default:
          if (char) {
            result += char;
          }

          index += 1;
          break;
      }
    }

    return result;
  }

  private static _unescapeSubstring(input: string): Substring {
    const fields = input.split('*');
    if (fields.length < 2) {
      throw new Error(`Wildcard missing: ${input}`);
    }

    return {
      initial: FilterParser._unescapeHexValues(fields.shift() ?? ''),
      final: FilterParser._unescapeHexValues(fields.pop() ?? ''),
      any: fields.map((field) => FilterParser._unescapeHexValues(field)),
    };
  }

  private static _parseSet(reader: BerReader): Filter[] {
    const filters: Filter[] = [];
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      filters.push(FilterParser.parse(reader));
    }

    return filters;
  }
}

// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { ProtocolOperation } from './ProtocolOperation';
import { Filter } from './filters/Filter';
import { PresenceFilter } from './filters/PresenceFilter';
import { AndFilter } from './filters/AndFilter';
import { GreaterThanEqualsFilter } from './filters/GreaterThanEqualsFilter';
import { ExtensibleFilter } from './filters/ExtensibleFilter';
import { NotFilter } from './filters/NotFilter';
import { SubstringFilter } from './filters/SubstringFilter';
import { EqualityFilter } from './filters/EqualityFilter';
import { ApproximateFilter } from './filters/ApproximateFilter';
import { OrFilter } from './filters/OrFilter';
import { LessThanEqualsFilter } from './filters/LessThanEqualsFilter';

export class FilterParser {
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
    const type: ProtocolOperation = reader.readSequence();

    let filter: Filter;
    switch (type) {
      case ProtocolOperation.FILTER_AND:
        const andFilters = FilterParser._parseSet(reader);
        filter = new AndFilter({
          filters: andFilters,
        });
        break;
      case ProtocolOperation.FILTER_APPROX:
        filter = new ApproximateFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_EQUALITY:
        filter = new EqualityFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_EXT:
        filter = new ExtensibleFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_GE:
        filter = new GreaterThanEqualsFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_LE:
        filter = new LessThanEqualsFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_NOT:
        const innerFilter = FilterParser.parse(reader);
        filter = new NotFilter({
          filter: innerFilter,
        });
        break;
      case ProtocolOperation.FILTER_OR:
        const orFilters = FilterParser._parseSet(reader);
        filter = new OrFilter({
          filters: orFilters,
        });
        break;
      case ProtocolOperation.FILTER_PRESENT:
        filter = new PresenceFilter();
        filter.parse(reader);
        break;
      case ProtocolOperation.FILTER_SUBSTRINGS:
        filter = new SubstringFilter();
        filter.parse(reader);
        break;
      default:
        throw new Error(`Invalid search filter type: 0x${type.toString(16)}`);
    }

    return filter;
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

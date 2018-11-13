export enum SearchFilter {
  and = 0xa0,
  or = 0xa1,
  not = 0xa2,
  equalityMatch = 0xa3,
  substrings = 0xa4,
  greaterOrEqual = 0xa5,
  lessOrEqual = 0xa6,
  present = 0x87,
  approxMatch = 0xa8,
  extensibleMatch = 0xa9,
}

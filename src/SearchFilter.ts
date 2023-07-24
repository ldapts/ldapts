export const SearchFilter = {
  and: 0xa0 as const,
  or: 0xa1 as const,
  not: 0xa2 as const,
  equalityMatch: 0xa3 as const,
  substrings: 0xa4 as const,
  greaterOrEqual: 0xa5 as const,
  lessOrEqual: 0xa6 as const,
  present: 0x87 as const,
  approxMatch: 0xa8 as const,
  extensibleMatch: 0xa9 as const,
};

export type SearchFilterValues = (typeof SearchFilter)[keyof typeof SearchFilter];

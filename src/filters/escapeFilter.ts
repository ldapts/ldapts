import { Filter } from './Filter.js';

/**
 * Tagged template literal for building LDAP filter strings. Every interpolated value is escaped
 * with {@link Filter.escape} (RFC 2254 / RFC 4515), which prevents filter syntax characters in
 * untrusted input from being misinterpreted as syntax (injection attacks).
 * @example
 * const filter = escapeFilter`(&(objectClass=user)(uid=${untrustedInput}))`;
 * @param {TemplateStringsArray} strings - Literal portions of the template
 * @param {...Buffer|boolean|number|string} values - Values to escape before interpolating
 * @returns {string} Filter string with all interpolated values escaped
 */
export function escapeFilter(strings: TemplateStringsArray, ...values: (Buffer | boolean | number | string)[]): string {
  let result = strings[0] ?? '';

  for (const [index, value] of values.entries()) {
    result += Filter.escape(typeof value === 'string' || Buffer.isBuffer(value) ? value : String(value));
    result += strings[index + 1] ?? '';
  }

  return result;
}

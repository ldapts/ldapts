/**
 * Encodes a postal address string into RFC 4517 Postal Address Syntax.
 * @param {string} address - The address with lines separated by the separator
 * @param {string} separator - Line separator in the input (default: '\n')
 * @returns {string} Encoded postal address string
 */
export function encodePostalAddress(address: string, separator = '\n'): string {
  return address
    .split(separator)
    .map((line) => line.replaceAll('\\', '\\5C').replaceAll('$', '\\24'))
    .join('$');
}

/**
 * Decodes an RFC 4517 Postal Address Syntax string into a postal address.
 * @param {string} encoded - The RFC 4517 encoded postal address
 * @param {string} separator - Line separator for the output (default: '\n')
 * @returns {string} Decoded postal address string
 */
export function decodePostalAddress(encoded: string, separator = '\n'): string {
  return encoded
    .split('$')
    .map((line) => line.replace(/\\(5c|24)/gi, (_, code: string) => (code === '24' ? '$' : '\\')))
    .join(separator);
}

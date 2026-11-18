import { TextDecoder } from 'node:util';

// ignoreBOM keeps a leading byte-order mark in the string, so string values encode back to the same octets
const utf8Decoder = new TextDecoder('utf8', { fatal: true, ignoreBOM: true });

/**
 * Converts the octets of an assertion value to the form filters hold it in: a string when the octets are
 * valid UTF-8, and the octets themselves when they are not (for example an Active Directory `objectGUID`).
 * Either form encodes back to the same octets.
 * @param {Buffer} octets - Octets of the assertion value
 * @returns {Buffer|string} The decoded string, or the octets when they are not valid UTF-8
 */
export function decodeAssertionValue(octets: Buffer): Buffer | string {
  try {
    return utf8Decoder.decode(octets);
  } catch {
    return octets;
  }
}

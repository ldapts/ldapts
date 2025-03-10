export type RDNAttributes = Record<string, string>;

/**
 * RDN is a part of DN, and it consists of key & value pair. This class also supports
 * compound RDNs, meaning that one RDN can hold multiple key & value pairs.
 */
export class RDN {
  private attrs: RDNAttributes = {};

  public constructor(attrs?: RDNAttributes) {
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        this.set(key, value);
      }
    }
  }

  /**
   * Set an RDN pair.
   * @param {string} name
   * @param {string} value
   * @returns {object} RDN class
   */
  public set(name: string, value: string): this {
    this.attrs[name] = value;
    return this;
  }

  /**
   * Get an RDN value at the specified name.
   * @param {string} name
   * @returns {string | undefined} value
   */
  public get(name: string): string | undefined {
    return this.attrs[name];
  }

  /**
   * Checks, if this instance of RDN is equal to the other RDN.
   * @param {object} other
   * @returns true if equal; otherwise false
   */
  public equals(other: RDN): boolean {
    const ourKeys = Object.keys(this.attrs);
    const otherKeys = Object.keys(other.attrs);

    if (ourKeys.length !== otherKeys.length) {
      return false;
    }

    ourKeys.sort();
    otherKeys.sort();

    for (const [i, key] of ourKeys.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (key == null || key !== otherKeys[i]) {
        return false;
      }

      const ourValue = this.attrs[key];
      const otherValue = other.attrs[key];

      if (ourValue == null && otherValue == null) {
        continue;
      }

      if (ourValue == null || otherValue == null || ourValue !== otherValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse the RDN, escape values & return a string representation.
   * @returns {string} Escaped string representation of RDN.
   */
  public toString(): string {
    let str = '';

    for (const [key, value] of Object.entries(this.attrs)) {
      if (str) {
        str += '+';
      }

      str += `${key}=${this._escape(value)}`;
    }

    return str;
  }

  /**
   * Escape values & return a string representation.
   *
   * RFC defines, that these characters should be escaped:
   *
   * Comma                          ,
   * Backslash character            \
   * Pound sign (hash sign)         #
   * Plus sign                      +
   * Less than symbol               <
   * Greater than symbol            >
   * Semicolon                      ;
   * Double quote (quotation mark)  "
   * Equal sign                     =
   * Leading or trailing spaces
   * @param {string} value - RDN value to be escaped
   * @returns {string} Escaped string representation of RDN
   */
  private _escape(value = ''): string {
    let str = '';
    let current = 0;
    let quoted = false;
    const len = value.length;

    const escaped = /["\\]/;
    const special = /[#+,;<=>]/;

    if (len > 0) {
      // Wrap strings with trailing or leading spaces in quotes
      quoted = value.startsWith(' ') || value[len - 1] === ' ';
    }

    while (current < len) {
      const character = value[current] ?? '';
      if (escaped.test(character) || (!quoted && special.test(character))) {
        str += '\\';
      }

      if (character) {
        str += character;
      }

      current += 1;
    }

    if (quoted) {
      str = `"${str}"`;
    }

    return str;
  }
}

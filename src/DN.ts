
/**
 * DNMap is a list, which holds key & value list pairs of a relative distinguished name (RDN).
 * This type is used to provide escaping mechanism of inputs.
 */
export type DNMap = RDN[];
type RDN = [string, string | number];

/**
 * DNBuilder provides chain building of multiple RDNs.
 * When this class is built, it returns an escaped string representation of a DN.
 */
export class DNBuilder {

  constructor(private readonly map: DNMap = []) { }

  /**
   * Add an RDN component to the DN map, consisting of key & value pair.
   * @param key
   * @param value
   * @returns DNBuilder
   */
  public addRDN(key: string, value: string | number) {
    this.map.push([key, value]);
    return this;
  }

  /**
   * Build the DN map, returning escaped string representation of the DN.
   */
  public build() {
    return this._escape(this.map);
  }

  /**
   * Parse an input DNMap, escape user-provided values & return a string representation.
   *
   * RFC defines, that these characters should be escaped:
   *
   * Comma 	                        ,
   * Backslash character 	          \
   * Pound sign (hash sign) 	      #
   * Plus sign 	                    +
   * Less than symbol 	            <
   * Greater than symbol 	          >
   * Semicolon 	                    ;
   * Double quote (quotation mark) 	"
   * Equal sign 	                  =
   * Leading or trailing spaces
   *
   * @param input DN object to be escaped
   * @returns Escaped string representation of DN
   */
  private _escape(input: DNMap) {
    const escapedResults = [];

    for (const object of input) {
      const key = object[0];
      const value = object[1];

      if (typeof value === 'number') {
        escapedResults.push(`${key}=${value}`);
        continue;
      }

      let escapedValue = '';
      for (const inputChar of value) {
        switch (inputChar) {
          case '"':
            escapedValue += '\\22';
            break;
          case '#':
            escapedValue += '\\23';
            break;
          case '+':
            escapedValue += '\\2b';
            break;
          case ',':
            escapedValue += '\\2c';
            break;
          case ';':
            escapedValue += '\\3b';
            break;
          case '<':
            escapedValue += '\\3c';
            break;
          case '=':
            escapedValue += '\\3d';
            break;
          case '>':
            escapedValue += '\\3e';
            break;
          case '\\':
            escapedValue += '\\5c';
            break;
          default:
            escapedValue += inputChar;
            break;
        }
      }

      // Replace existing trailing & leading whitespaces.
      escapedValue
        .replace(/^(\u0020)/gm, '\\ ')
        .replace(/(\u0020)$/gm, '\\ ');

      escapedResults.push(`${key}=${escapedValue}`);
    }

    return escapedResults.join(',');
  }
}

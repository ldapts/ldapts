
/**
 * DNMap is a list, which holds key & value list pairs of a distinguished name.
 * This object is used to provide escaping mechanism of inputs.
 */
export type DNMap = DNObject[];
type DNObject = [string, string | number];

/**
 * EscapeDN will parse an input DNObject, escape user-provided values & return a string representation.
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
 * @returns
 */
export function escapeDN(input: DNMap): string {
  const escapedResults = [];

  for (const object of input) {
    const key = object[0];
    const value = object[1];

    if (typeof value === 'number') {
      escapedResults.push(`${key.toString()}=${value}`);
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

    escapedResults.push(`${key.toString()}=${escapedValue}`);
  }

  return escapedResults.join(',');
}

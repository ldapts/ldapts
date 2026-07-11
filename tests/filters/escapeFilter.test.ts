import { describe, expect, it } from 'vite-plus/test';

import { escapeFilter } from '../../src/index.js';

describe('escapeFilter', () => {
  it('should escape filter syntax characters in interpolated values', () => {
    const value = '*)(uid=*';

    expect(escapeFilter`(cn=${value})`).toBe('(cn=\\2a\\29\\28uid=\\2a)');
  });

  it('should not escape literal portions of the template', () => {
    expect(escapeFilter`(&(email=*@bar.com)(l=Seattle))`).toBe('(&(email=*@bar.com)(l=Seattle))');
  });

  it('should escape multiple interpolated values', () => {
    const mail = 'x*x@foo.net';
    const organization = 'Parens (R Us)';

    expect(escapeFilter`(&(email=${mail})(o=${organization}))`).toBe('(&(email=x\\2ax@foo.net)(o=Parens \\28R Us\\29))');
  });

  it('should stringify number and boolean values', () => {
    expect(escapeFilter`(&(uidNumber=${1000})(enabled=${true}))`).toBe('(&(uidNumber=1000)(enabled=true))');
  });

  it('should escape buffer values as hex escape sequences', () => {
    expect(escapeFilter`(objectGUID=${Buffer.from([0x01, 0xff])})`).toBe('(objectGUID=\\01\\ff)');
  });

  it('should support templates without interpolated values', () => {
    expect(escapeFilter`(cn=admin)`).toBe('(cn=admin)');
  });

  it('should support adjacent interpolated values', () => {
    expect(escapeFilter`(cn=${'a*'}${'(b'})`).toBe('(cn=a\\2a\\28b)');
  });
});

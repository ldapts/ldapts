import { describe, expect, it } from 'vitest';

import { RDN } from '../../src/dn/RDN.js';

describe('RDN', () => {
  describe('#toString()', () => {
    it('should format & escape correct string representation', () => {
      const rdn1 = new RDN({ cn: 'Smith, James K.' });
      expect(rdn1.toString()).toBe('cn=Smith\\, James K.');

      const rdn2 = new RDN({ ou: 'Sales\\Engineering' });
      expect(rdn2.toString()).toBe('ou=Sales\\\\Engineering');

      const rdn3 = new RDN({ cn: 'East#Test + Lab' });
      expect(rdn3.toString()).toBe('cn=East\\#Test \\+ Lab');

      const rdn4 = new RDN({ cn: ' Jim Smith ' });
      expect(rdn4.toString()).toBe('cn=" Jim Smith "');

      const rdn5 = new RDN({ cn: '  Bob   Barker' });
      expect(rdn5.toString()).toBe('cn="  Bob   Barker"');
    });

    it('should format correct compound string representation', () => {
      const rdn = new RDN({ dc: 'domain', oa: 'eu' });
      expect(rdn.toString()).toBe('dc=domain+oa=eu');
    });
  });

  describe('#equals()', () => {
    it('should equal two exact objects', () => {
      const rdn1 = new RDN({ dc: 'domain', oa: 'eu' });
      const rdn2 = new RDN({ dc: 'domain', oa: 'eu' });
      expect(rdn1.equals(rdn2)).toBe(true);

      const rdn3 = new RDN({ oa: 'eu', dc: 'domain' });
      const rdn4 = new RDN({ dc: 'domain', oa: 'eu' });
      expect(rdn3.equals(rdn4)).toBe(true);
    });

    it('should not equal two different objects', () => {
      const rdn1 = new RDN({ dc: 'domain1' });
      const rdn2 = new RDN({ dc: 'domain2' });
      expect(rdn1.equals(rdn2)).not.toBe(true);

      const rdn3 = new RDN({ dc: 'same' });
      const rdn4 = new RDN({ oa: 'same' });
      expect(rdn3.equals(rdn4)).not.toBe(true);

      const rdn5 = new RDN({ dc: 'domain', oa: 'eu' });
      const rdn6 = new RDN({ oa: 'eu' });
      expect(rdn5.equals(rdn6)).not.toBe(true);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { DN } from '../../src/index.js';

describe('DN', () => {
  describe('#toString()', () => {
    it('should chain build & escape correctly', () => {
      const dn = new DN()
        .addRDN({
          cn: 'Smith, James K.',
          oa: 'eu',
        })
        .addPairRDN('dc', 'domain')
        .addRDNs({
          dc: 'gb',
          group: 'all',
        });

      expect(dn.toString()).toBe('cn=Smith\\, James K.+oa=eu,dc=domain,dc=gb,group=all');
    });

    it('should create a correct DN from object', () => {
      const dn = new DN({
        cn: 'Smith, James K.',
        oa: 'eu',
        dc: 'domain',
      }).addRDNs({
        dc: 'gb',
        group: 'all',
      });

      expect(dn.toString()).toBe('cn=Smith\\, James K.,oa=eu,dc=domain,dc=gb,group=all');
    });

    it('should handle values with the same key', () => {
      const dn = new DN({
        oa: 'eu',
        dc: ['domain1', 'domain2'],
      });

      expect(dn.toString()).toBe('oa=eu,dc=domain1,dc=domain2');
    });
  });

  describe('#equals()', () => {
    it('should equal two exact objects', () => {
      const dn1 = new DN({ dc: 'domain', oa: 'eu' });
      const dn2 = new DN({ dc: 'domain', oa: 'eu' });
      expect(dn1.equals(dn2)).toBe(true);
    });

    it('should not equal two different objects', () => {
      const dn1 = new DN({ oa: 'eu', dc: 'domain' });
      const dn2 = new DN({ dc: 'domain', oa: 'eu' });
      expect(dn1.equals(dn2)).not.toBe(true);
    });
  });

  describe('#clone()', () => {
    it('should clone when RDNs have a value', () => {
      const dn = new DN({ dc: ['hello'], oa: 'aaa' });
      const clone1 = dn.clone().addPairRDN('cn', 'test');
      const clone2 = dn.clone().addPairRDN('cn', 'test');
      expect(dn.toString()).toBe('dc=hello,oa=aaa');
      expect(clone1.toString()).toBe('dc=hello,oa=aaa,cn=test');
      expect(clone2.toString()).toBe('dc=hello,oa=aaa,cn=test');
    });
  });
});

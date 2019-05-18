
import { DN } from '../../src';

describe('DN', () => {

  describe('#toString()', () => {
    it('should chain build & escape correctly', () => {
      const dn = new DN()
        .addRDN({ cn: 'Smith, James K.', oa: 'eu' })
        .addPair('dc', 'domain')
        .add({ dc: 'gb', group: 'all' });

      dn.toString().should.equal('cn=Smith\\, James K.+oa=eu,dc=domain,dc=gb,group=all');
    });

    it('should create a correct DN from object', () => {
      const dn = new DN({
        cn: 'Smith, James K.',
        oa: 'eu',
        dc: 'domain',
      })
      .add({ dc: 'gb', group: 'all' });

      dn.toString().should.equal('cn=Smith\\, James K.,oa=eu,dc=domain,dc=gb,group=all');
    });

    it('should handle values with the same key', () => {
      const dn = new DN({
        oa: 'eu',
        dc: ['domain1', 'domain2'],
      });

      dn.toString().should.equal('oa=eu,dc=domain1,dc=domain2');
    });
  });

  describe('#equals()', () => {
    it('should equal two exact objects', () => {
      const dn1 = new DN({ dc: 'domain', oa: 'eu' });
      const dn2 = new DN({ dc: 'domain', oa: 'eu' });
      dn1.equals(dn2).should.equal(true);
    });

    it('should not equal two different objects', () => {
      const dn1 = new DN({ oa: 'eu', dc: 'domain' });
      const dn2 = new DN({ dc: 'domain', oa: 'eu' });
      dn1.equals(dn2).should.not.equal(true);
    });
  });
});

import { RDN } from '../../src';

describe('RDN', () => {

  describe('#toString()', () => {
    it('should format & escape correct string representation', () => {
      const rdn1 = new RDN({ cn: 'Smith, James K.' });
      rdn1.toString().should.equal('cn=Smith\\, James K.');

      const rdn2 = new RDN({ ou: 'Sales\\Engineering' });
      rdn2.toString().should.equal('ou=Sales\\\\Engineering');

      const rdn3 = new RDN({ cn: 'East#Test + Lab' });
      rdn3.toString().should.equal('cn=East\\#Test \\+ Lab');

      const rdn4 = new RDN({ cn: ' Jim Smith ' });
      rdn4.toString().should.equal('cn=" Jim Smith "');

      const rdn5 = new RDN({ cn: '  Bob   Barker' });
      rdn5.toString().should.equal('cn="  Bob   Barker"');
    });

    it('should format correct compound string representation', () => {
      const rdn = new RDN({ dc: 'domain', oa: 'eu' });
      rdn.toString().should.equal('dc=domain+oa=eu');
    });
  });

  describe('#equals()', () => {
    it('should equal two exact objects', () => {
      const rdn1 = new RDN({ dc: 'domain', oa: 'eu' });
      const rdn2 = new RDN({ dc: 'domain', oa: 'eu' });
      rdn1.equals(rdn2).should.equal(true);

      const rdn3 = new RDN({ oa: 'eu', dc: 'domain' });
      const rdn4 = new RDN({ dc: 'domain', oa: 'eu' });
      rdn3.equals(rdn4).should.equal(true);
    });

    it('should not equal two different objects', () => {
      const rdn1 = new RDN({ dc: 'domain1' });
      const rdn2 = new RDN({ dc: 'domain2' });
      rdn1.equals(rdn2).should.not.equal(true);

      const rdn3 = new RDN({ dc: 'same' });
      const rdn4 = new RDN({ oa: 'same' });
      rdn3.equals(rdn4).should.not.equal(true);

      const rdn5 = new RDN({ dc: 'domain', oa: 'eu' });
      const rdn6 = new RDN({ oa: 'eu' });
      rdn5.equals(rdn6).should.not.equal(true);
    });
  });
});

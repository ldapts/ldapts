
import { DNMap, DNBuilder } from '../src/DN';

describe('DN', () => {
  describe('DNBuilder', () => {
    it('should build & escape correctly', () => {
      const dn = new DNBuilder()
        .addRDN('cn', 'Smith, James K.')
        .addRDN('dc', 'env.organization')
        .addRDN('dc', 'env.domain')
        .build();

      dn.should.equal('cn=Smith\\2c James K.,dc=env.organization,dc=env.domain');
    });

    it('should escape correctly', () => {
      let dn: DNMap;

      dn = [['cn', 'Smith, James K.']];
      new DNBuilder(dn).build().should.equal('cn=Smith\\2c James K.');

      dn = [['ou', 'Sales\\Engineering']];
      new DNBuilder(dn).build().should.equal('ou=Sales\\5cEngineering');

      dn = [['cn', 'East#Test + Lab']];
      new DNBuilder(dn).build().should.equal('cn=East\\23Test \\2b Lab');
    });

    it('should escape trailing & leading whitespaces', () => {
      let dn: DNMap;

      dn = [['cn', ' Jim Smith ']];
      new DNBuilder(dn).build().should.equal('cn=\ Jim Smith\ ');

      dn = [['cn', '  Bob   Barker']];
      new DNBuilder(dn).build().should.equal('cn=\  Bob   Barker');
    });
  });
});

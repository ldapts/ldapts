
import { DNMap, escapeDN } from '../src/DN';

describe('DN', () => {
  describe('DNMap', () => {
    it('should escape correctly', () => {
      let dn: DNMap;

      dn = [['cn', 'Smith, James K.']];
      escapeDN(dn).should.equal('cn=Smith\\2c James K.');

      dn = [['ou', 'Sales\\Engineering']];
      escapeDN(dn).should.equal('ou=Sales\\5cEngineering');

      dn = [['cn', 'East#Test + Lab']];
      escapeDN(dn).should.equal('cn=East\\23Test \\2b Lab');
    });

    it('should escape trailing & leading whitespaces', () => {
      let dn: DNMap;

      dn = [['cn', ' Jim Smith ']];
      escapeDN(dn).should.equal('cn=\ Jim Smith\ ');

      dn = [['cn', '  Bob   Barker']];
      escapeDN(dn).should.equal('cn=\  Bob   Barker');
    });
  });
});

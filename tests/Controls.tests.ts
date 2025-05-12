process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import * as chai from 'chai';
import 'chai/register-should.js';
import chaiAsPromised from 'chai-as-promised';

import { ServerSideSortingRequestControl } from '../src/index.js';
import { Client } from '../src/index.js';

chai.use(chaiAsPromised);

const LDAP_URI = 'ldap://localhost:389';
const BASE_DN = 'dc=ldap,dc=local';
const BIND_DN = `cn=admin,${BASE_DN}`;
const BIND_PW = '1234';

describe('Controls', () => {
  describe('ServerSideSortingRequestControl', () => {
    it('should sort values', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      const res = await client.search(
        BASE_DN,
        {
          filter: 'uid=*',
          attributes: ['uid'],
        },
        new ServerSideSortingRequestControl({
          value: { reverseOrder: false, attributeType: 'uid', orderingRule: 'caseIgnoreOrderingMatch' },
        }),
      );
      const results = res.searchEntries.map((entry) => entry['uid']) as [string, ...string[]];

      results[0].should.equal(results.sort()[0]);
    });

    it('should sort values (descending)', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      const res = await client.search(
        BASE_DN,
        {
          filter: 'uid=*',
          attributes: ['uid'],
        },
        new ServerSideSortingRequestControl({
          value: { reverseOrder: true, attributeType: 'uid', orderingRule: 'caseIgnoreOrderingMatch' },
        }),
      );
      const results = res.searchEntries.map((entry) => entry['uid']) as [string, ...string[]];

      results[0].should.equal(results.sort().reverse()[0]);
    });
  });
});

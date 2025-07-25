process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BerReader, BerWriter } from 'asn1';
import * as chai from 'chai';
import 'chai/register-should.js';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import type { AddRequest, ModifyDNRequest } from '../src/index.js';
import {
  AddResponse,
  AndFilter,
  Attribute,
  Change,
  Client,
  Control,
  EqualityFilter,
  InvalidCredentialsError,
  InvalidDNSyntaxError,
  ModifyDNResponse,
  NoSuchObjectError,
  PagedResultsControl,
  UndefinedTypeError,
} from '../src/index.js';

chai.use(chaiAsPromised);
const should = chai.should();

const LDAP_DOMAIN = 'ldap.local';
const LDAP_URI = 'ldap://localhost:389';
const SECURE_LDAP_URI = 'ldaps://localhost:636';
const BASE_DN = 'dc=ldap,dc=local';
const BIND_DN = `cn=admin,${BASE_DN}`;
const BIND_PW = '1234';

describe('Client', () => {
  describe('#constructor()', () => {
    it('should throw error if url protocol is not ldap:// or ldaps://', () => {
      const url = 'https://127.0.0.1';
      ((): void => {
        new Client({
          url,
        });
      }).should.throw(Error, `${url} is an invalid LDAP URL (protocol)`);
    });

    it('should not throw error if url protocol is ldap://', () => {
      const url = 'ldap://127.0.0.1';
      ((): void => {
        new Client({
          url,
        });
      }).should.not.throw(Error);
    });

    it('should not throw error if url protocol is ldaps://', () => {
      const url = 'ldaps://127.0.0.1';
      ((): void => {
        new Client({
          url,
        });
      }).should.not.throw(Error);
    });
  });

  describe('#isConnected', () => {
    it('should not be connected if a method has not been called', () => {
      const client = new Client({
        url: LDAP_URI,
      });

      client.isConnected.should.equal(false);
    });

    it('should not be connected after unbind has been called', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      client.isConnected.should.equal(true);

      await client.unbind();

      client.isConnected.should.equal(false);
    });

    it('should be connected if a method has been called', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      client.isConnected.should.equal(true);

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });

    it('should allow bind/unbind to be called multiple times without error', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      client.isConnected.should.equal(false);
      await client.bind(BIND_DN, BIND_PW);
      client.isConnected.should.equal(true);
      await client.unbind();
      client.isConnected.should.equal(false);

      await client.bind(BIND_DN, BIND_PW);
      client.isConnected.should.equal(true);
      await client.unbind();
      client.isConnected.should.equal(false);
    });
  });

  describe('#bind()', () => {
    it('should succeed on basic bind', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });

    it('should succeed with ldaps://', async () => {
      await using client = new Client({
        url: SECURE_LDAP_URI,
      });

      // @ts-expect-error - private field
      client.secure.should.equal(true);
      await client.bind(BIND_DN, BIND_PW);
    });

    it('should throw for invalid credentials', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      try {
        await client.bind(BIND_DN, 'AlsoNotAHotdog');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof InvalidCredentialsError).should.equal(true);
      } finally {
        await client.unbind();
      }
    });

    it('should bind using EXTERNAL sasl mechanism', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      const testsDirectory = fileURLToPath(new URL('.', import.meta.url));
      const [ca, cert, key] = await Promise.all([
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.readFile(path.join(testsDirectory, './data/certs/ca.pem')),
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.readFile(path.join(testsDirectory, './data/certs/client.pem')),
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.readFile(path.join(testsDirectory, './data/certs/client-key.pem')),
      ]);

      await client.startTLS({
        ca,
        cert,
        key,
      });

      await client.bind('EXTERNAL');

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });

    it('should bind with a custom control', async () => {
      // Get list of supported controls and extensions:
      // ldapsearch -H ldaps://localhost:636 -b "" -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -s base supportedFeatures supportedControl supportedExtension
      let hasParsed = false;
      let hasWritten = false;

      class PasswordPolicyControl extends Control {
        public constructor() {
          super('1.3.6.1.4.1.42.2.27.8.5.1');
        }

        public override parseControl(reader: BerReader): void {
          // Should be called as part of the response from the server
          hasParsed = true;

          super.parseControl(reader);
        }

        public override writeControl(writer: BerWriter): void {
          // Should be called as part of the request to the server
          hasWritten = true;
          super.writeControl(writer);
        }
      }

      const testControl = new PasswordPolicyControl();

      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(`uid=user2,${BASE_DN}`, BIND_PW);

      try {
        await client.modify(
          `uid=user2,${BASE_DN}`,
          new Change({
            operation: 'replace',
            modification: new Attribute({
              type: 'userPassword',
              values: ['1234'],
            }),
          }),
          testControl,
        );
        false.should.equal(true, 'Exception expected');
      } catch (e) {
        // surely will happen
      }

      hasWritten.should.equal(true, 'Did not call PasswordPolicyControl#writeControl');
      hasParsed.should.equal(true, 'Did not call PasswordPolicyControl#parseControl');
    });
  });

  describe('#startTLS()', () => {
    it('should upgrade an existing clear-text connection to be secure', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.startTLS();
    });

    it('should use secure connection for subsequent operations', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.startTLS();
      await client.bind(BIND_DN, BIND_PW);
      await client.unbind();
    });
  });

  describe('#unbind()', () => {
    it('should succeed on basic unbind after successful bind', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      await client.unbind();
    });

    it('should succeed if client.bind() was not called previously', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.unbind();
    });

    it('should allow unbind to be called multiple times without error', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      await Promise.all([client.unbind(), client.unbind()]);

      await client.unbind();
    });

    it('should destroy socket after unbind', async () => {
      const client = new Client({
        connectTimeout: 5000,
        url: 'ldaps://localhost:389',
      });

      try {
        // @ts-expect-error - is private
        await client._connect();
        await client.bind(BIND_DN, BIND_PW);
        await client.unbind();
      } catch (e) {
        // ignore
      } finally {
        // @ts-expect-error - is private
        should.equal(client.connectTimer, undefined);
        // @ts-expect-error - is private
        should.equal(client.socket, undefined);
      }
    });
  });

  describe('#compare()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should return true if entry has the specified attribute and value', async () => {
      const result = await client.compare(`uid=user1,${BASE_DN}`, 'sn', 'SURNAME');
      result.should.equal(true);
    });

    it('should return false if entry does not have the specified attribute and value', async () => {
      const result = await client.compare(`uid=user1,${BASE_DN}`, 'sn', 'Stark');
      result.should.equal(false);
    });

    it('should throw if attribute is invalid', async () => {
      try {
        await client.compare(`uid=user1,${BASE_DN}`, 'lorem', 'ipsum');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof UndefinedTypeError).should.equal(true);
      }
    });

    it('should throw if target dn does not exist', async () => {
      try {
        await client.compare(`uid=foo.bar,${BASE_DN}`, 'uid', 'bruce.banner');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof NoSuchObjectError).should.equal(true);
      }
    });

    it('should throw on invalid DN', async () => {
      try {
        await client.compare('foo=bar', 'cn', 'bar');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof InvalidDNSyntaxError).should.equal(true);
      }
    });
  });

  describe('#modify()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should allow replacing an attribute', async () => {
      await client.modify(
        `uid=user4,${BASE_DN}`,
        new Change({
          operation: 'replace',
          modification: new Attribute({
            type: 'mail',
            values: [`four@${LDAP_DOMAIN}`],
          }),
        }),
      );
      const { searchEntries } = await client.search(BASE_DN, {
        filter: `uid=user4`,
        attributes: ['mail'],
      });
      searchEntries.should.have.length(1);
      searchEntries[0]?.should.have.property('mail').that.equals(`four@${LDAP_DOMAIN}`);
      // change it back to user4@LDAP_DOMAIN
      await client.modify(
        `uid=user4,${BASE_DN}`,
        new Change({
          operation: 'replace',
          modification: new Attribute({
            type: 'mail',
            values: [`user4@${LDAP_DOMAIN}`],
          }),
        }),
      );
      const { searchEntries: searchEntries2 } = await client.search(BASE_DN, {
        filter: `uid=user4`,
        attributes: ['mail'],
      });
      searchEntries2.should.have.length(1);
      searchEntries2[0]?.should.have.property('mail').that.equals(`user4@${LDAP_DOMAIN}`);
    });

    it('should allow pushing onto attributes', async () => {
      await client.modify(
        `uid=user4,${BASE_DN}`,
        new Change({
          operation: 'add',
          modification: new Attribute({
            type: 'mail',
            values: [`four@${LDAP_DOMAIN}`],
          }),
        }),
      );
      const { searchEntries } = await client.search(BASE_DN, {
        filter: `uid=user4`,
        attributes: ['mail'],
      });

      searchEntries.should.have.length(1);
      searchEntries[0]?.should.have.property('mail').that.includes(`four@${LDAP_DOMAIN}`);
    });

    it('should allow removing an attribute', async () => {
      await client.modify(
        `uid=user4,${BASE_DN}`,
        new Change({
          operation: 'delete',
          modification: new Attribute({
            type: 'mail',
            values: [`four@${LDAP_DOMAIN}`],
          }),
        }),
      );
      const { searchEntries } = await client.search(BASE_DN, {
        filter: `uid=user4`,
        attributes: ['mail'],
      });
      searchEntries.should.have.length(1);
      searchEntries[0]?.should.have.property('mail').that.equals(`user4@${LDAP_DOMAIN}`);
    });

    it('should allow updating binary attributes', async () => {
      // this should be a 10x10 green square PNG
      // we're putting it in an attribute called jpegPhoto but that doesn't matter for the test
      const jpegPhotoBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC', 'base64');
      await client.modify(
        `uid=user4,${BASE_DN}`,
        new Change({
          operation: 'replace',
          modification: new Attribute({
            type: 'jpegPhoto',
            values: [jpegPhotoBuffer],
          }),
        }),
      );
      const { searchEntries: searchEntries2 } = await client.search(BASE_DN, {
        filter: `uid=user4`,
        attributes: ['jpegPhoto'],
      });
      searchEntries2.should.have.length(1);
      searchEntries2[0]?.should.have.property('jpegPhoto').that.eqls(jpegPhotoBuffer);
    });
  });

  describe('#add()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should allow adding entry with null or undefined attribute value. Issue #88', async () => {
      // @ts-expect-error - Private method
      const stub = sinon.stub(client, '_send').returns(
        new AddResponse({
          messageId: 123,
        }),
      );

      await client.add(`uid=reed.richards,${BASE_DN}`, {
        // @ts-expect-error - Test data
        userPassword: null,
        // @ts-expect-error - Test data
        foo: undefined,
      });

      stub.restore();
      stub.calledOnce.should.equal(true);
      const args = stub.getCall(0).args[0] as AddRequest;
      args.attributes.should.deep.equal([
        new Attribute({
          type: 'userPassword',
          values: [],
        }),
        new Attribute({
          type: 'foo',
          values: [],
        }),
      ]);
    });
  });

  describe('#modifyDN()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should set newSuperior when newDN is a string and contains a comma', async () => {
      // @ts-expect-error - Private method
      const stub = sinon.stub(client, '_send').returns(
        new ModifyDNResponse({
          messageId: 123,
        }),
      );

      const dn = 'uid=groot,ou=Users,dc=foo,dc=com';
      const newRdn = 'uid=new-groot';
      const newSuperior = 'ou=Users,dc=foo,dc=com';
      const newDN = `${newRdn},${newSuperior}`;
      await client.modifyDN(dn, newDN);

      stub.restore();
      stub.calledOnce.should.equal(true);
      const args = stub.getCall(0).args[0] as ModifyDNRequest;
      args.dn.should.equal(dn);
      args.deleteOldRdn.should.equal(true);
      args.newRdn.should.equal(newRdn);
      args.newSuperior.should.equal(newSuperior);
      should.equal(args.controls, undefined);
    });

    it('should handle escaped comma in newDN. Issue #87', async () => {
      // @ts-expect-error - Private method
      const stub = sinon.stub(client, '_send').returns(
        new ModifyDNResponse({
          messageId: 123,
        }),
      );

      const dn = 'uid=groot,ou=Users,dc=foo,dc=com';
      const newRdn = 'uid=new\\,groot';
      const newSuperior = 'ou=Users,dc=foo,dc=com';
      const newDN = `${newRdn},${newSuperior}`;
      await client.modifyDN(dn, newDN);

      stub.restore();
      stub.calledOnce.should.equal(true);
      const args = stub.getCall(0).args[0] as ModifyDNRequest;
      args.dn.should.equal(dn);
      args.deleteOldRdn.should.equal(true);
      args.newRdn.should.equal(newRdn);
      args.newSuperior.should.equal(newSuperior);
      should.equal(args.controls, undefined);
    });

    it('should handle newSuperior with the long form', async () => {
      // @ts-expect-error - Private method
      const stub = sinon.stub(client, '_send').returns(
        new ModifyDNResponse({
          messageId: 123,
        }),
      );

      const dn = 'uid=groot,ou=Users,dc=foo,dc=com';
      const newRdn = 'uid=groot';
      const newSuperior =
        'OU=O|10006677|重新命名选择权测试部门3,OU=O|10006677|重新命名选择权测试部门2,OU=O|10006677|重新命名选择权测试部门1,OU=O|10006677|重新命名选择权测试部门,OU=O|10002220|重新命名选择权,OU=重新命名选择权中心测试,ou=Users,dc=foo,dc=com';
      const newDN = `${newRdn},${newSuperior}`;
      await client.modifyDN(dn, newDN);

      stub.restore();
      stub.calledOnce.should.equal(true);
      const args = stub.getCall(0).args[0] as ModifyDNRequest;
      args.dn.should.equal(dn);
      args.deleteOldRdn.should.equal(true);
      args.newRdn.should.equal(newRdn);
      args.newSuperior.should.equal(newSuperior);
      should.equal(args.controls, undefined);
    });
  });

  describe('#exop()', () => {
    it('should throw if fast bind is not supported', async () => {
      const client: Client = new Client({
        url: LDAP_URI,
      });

      try {
        await client.exop('1.2.840.113556.1.4.1781');
        false.should.equal(true);
      } catch (ex) {
        if (ex instanceof Error) {
          ex.message.should.equal('unsupported extended operation Code: 0x2');
        } else {
          assert.fail('Exception was not of type Error');
        }
      }

      await client.bind(BIND_DN, BIND_PW);
      await client.unbind();
    });
  });

  describe('#search()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should return search entries with (objectclass=*) if no filter is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(objectclass=*)"
      const searchResult = await client.search(BASE_DN);

      searchResult.searchEntries.length.should.be.greaterThan(0);
    });

    it('should throw error if an operation is performed after the client has closed connection', async () => {
      const testClient = new Client({
        url: LDAP_URI,
      });

      try {
        await testClient.bind(BIND_DN, BIND_PW);

        const unbindRequest = testClient.unbind();
        const searchRequest = testClient.search(BASE_DN);
        await unbindRequest;
        await searchRequest;
        false.should.equal(true);
      } catch (ex) {
        if (ex instanceof Error) {
          ex.message.should.equal('Connection closed before message response was received. Message type: SearchRequest (0x63)');
        } else {
          assert.fail('Exception was not of type Error');
        }
      } finally {
        await testClient.unbind();
      }
    });

    it('should return full search entries if filter="(mail=user1@ldap.local)"', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search(BASE_DN, {
        filter: `(mail=user1@${LDAP_DOMAIN})`,
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'user1',
          dn: 'uid=user1,dc=ldap,dc=local',
          gidNumber: '14564100',
          homeDirectory: '/home/user',
          loginShell: '/bin/bash',
          mail: 'user1@ldap.local',
          objectClass: ['top', 'posixAccount', 'inetOrgPerson'],
          sn: 'SURNAME',
          uid: 'user1',
          uidNumber: '14583101',
          userPassword: '{SHA}cRDtpNCeBiql5KOQsKVyrA0sAiA=',
        },
      ]);
    });

    it('should return full search entries if filter="(mail=user1*)"', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search(BASE_DN, {
        filter: '(mail=user1*)',
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'user1',
          dn: 'uid=user1,dc=ldap,dc=local',
          gidNumber: '14564100',
          homeDirectory: '/home/user',
          loginShell: '/bin/bash',
          mail: 'user1@ldap.local',
          objectClass: ['top', 'posixAccount', 'inetOrgPerson'],
          sn: 'SURNAME',
          uid: 'user1',
          uidNumber: '14583101',
          userPassword: '{SHA}cRDtpNCeBiql5KOQsKVyrA0sAiA=',
        },
      ]);
    });

    it('should return parallel search entries if filter="(mail=user1@ldap.local)". Issue #83', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const [result1, result2, result3] = await Promise.all([
        client.search(BASE_DN, {
          filter: `(mail=user1@${LDAP_DOMAIN})`,
        }),
        client.search(BASE_DN, {
          filter: `(mail=user1@${LDAP_DOMAIN})`,
        }),
        client.search(BASE_DN, {
          filter: `(mail=user1@${LDAP_DOMAIN})`,
        }),
      ]);
      const expectedResult = [
        {
          cn: 'user1',
          dn: 'uid=user1,dc=ldap,dc=local',
          gidNumber: '14564100',
          homeDirectory: '/home/user',
          loginShell: '/bin/bash',
          mail: 'user1@ldap.local',
          objectClass: ['top', 'posixAccount', 'inetOrgPerson'],
          sn: 'SURNAME',
          uid: 'user1',
          uidNumber: '14583101',
          userPassword: '{SHA}cRDtpNCeBiql5KOQsKVyrA0sAiA=',
        },
      ];

      result1.searchEntries.should.deep.equal(expectedResult);
      result2.searchEntries.should.deep.equal(expectedResult);
      result3.searchEntries.should.deep.equal(expectedResult);
    });

    it('should allow arbitrary controls 1.2.840.113556.1.4.417 to be specified', async () => {
      const searchResult = await client.search(
        BASE_DN,
        {
          scope: 'sub',
          filter: '(isDeleted=*)',
        },
        new Control('1.2.840.113556.1.4.417'),
      );

      searchResult.searchEntries.length.should.equal(0);
    });

    it('should restrict attributes returned if attributes are specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search(BASE_DN, {
        scope: 'sub',
        filter: `(mail=user1@${LDAP_DOMAIN})`,
        attributes: ['cn'],
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: `uid=user1,${BASE_DN}`,
          cn: 'user1',
        },
      ]);
    });

    it('should include attributes without values if attributes are specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search(BASE_DN, {
        scope: 'sub',
        filter: `(mail=user1@${LDAP_DOMAIN})`,
        attributes: ['cn', 'telephoneNumber'],
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: `uid=user1,${BASE_DN}`,
          cn: 'user1',
          telephoneNumber: [],
        },
      ]);
    });

    it('should return clean list of attributes even if the requested attribute is in the wrong case', async () => {
      const searchResult = await client.search(BASE_DN, {
        scope: 'sub',
        filter: `(mail=user1@${LDAP_DOMAIN})`,
        attributes: ['homedirectory'],
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: `uid=user1,${BASE_DN}`,
          homeDirectory: '/home/user',
        },
      ]);
    });

    it('should not return attribute values if returnAttributeValues=false', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -A "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search(BASE_DN, {
        scope: 'sub',
        filter: `(mail=user1@${LDAP_DOMAIN})`,
        returnAttributeValues: false,
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: [],
          dn: 'uid=user1,dc=ldap,dc=local',
          gidNumber: [],
          homeDirectory: [],
          loginShell: [],
          mail: [],
          objectClass: [],
          sn: [],
          uid: [],
          uidNumber: [],
          userPassword: [],
        },
      ]);
    });

    it('should page search entries if paging is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -E pr=2/noprompt "objectClass=jumpcloudUser"
      const searchResult = await client.search(BASE_DN, {
        filter: 'objectClass=*',
        paged: {
          pageSize: 2,
        },
      });

      searchResult.searchEntries.length.should.be.greaterThan(2);
    });

    it('should allow sizeLimit when no paging is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -z 6 'cn=*'
      const searchResult = await client.search(BASE_DN, {
        filter: 'cn=*',
        sizeLimit: 3,
      });

      searchResult.searchEntries.length.should.equal(3);
    });

    it('should allow sizeLimit when paging is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -E pr=3/noprompt -z 5 'cn=*'
      const searchResult = await client.search(BASE_DN, {
        filter: 'cn=*',
        sizeLimit: 5,
        paged: {
          pageSize: 3,
        },
      });

      searchResult.searchEntries.length.should.equal(5);
    });

    it('should return group contents with parenthesis in name - explicit filter controls', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(&(objectClass=groupOfNames)(cn=Something \28Special\29))"
      const searchResult = await client.search(BASE_DN, {
        filter: new AndFilter({
          filters: [
            new EqualityFilter({
              attribute: 'objectClass',
              value: 'posixGroup',
            }),
            new EqualityFilter({
              attribute: 'cn',
              value: 'UserGroup2 (Test)',
            }),
          ],
        }),
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'UserGroup2 (Test)',
          dn: 'cn=UserGroup2 (Test),dc=ldap,dc=local',
          gidNumber: '2539',
          memberUid: ['user3', 'user2'],
          objectClass: ['posixGroup', 'top'],
        },
      ]);
    });

    it('should return group contents with parenthesis in name - string filter', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(&(objectClass=groupOfNames)(cn=Something \28Special\29))"
      const searchResult = await client.search(BASE_DN, {
        filter: '(&(objectClass=posixGroup)(cn=UserGroup2 \\28Test\\29))',
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'UserGroup2 (Test)',
          dn: 'cn=UserGroup2 (Test),dc=ldap,dc=local',
          gidNumber: '2539',
          memberUid: ['user3', 'user2'],
          objectClass: ['posixGroup', 'top'],
        },
      ]);
    });

    it('should throw if a PagedResultsControl is specified', async () => {
      const pagedResultsControl = new PagedResultsControl({});

      try {
        await client.search('cn=test', {}, pagedResultsControl);
        true.should.equal(false);
      } catch (ex) {
        if (ex instanceof Error) {
          ex.message.should.equal('Should not specify PagedResultsControl');
        } else {
          assert.fail('Exception was not of type Error');
        }
      }
    });

    it('should throw if a PagedResultsControl is specified in the controls array', async () => {
      const pagedResultsControl = new PagedResultsControl({});

      try {
        await client.search('cn=test', {}, [pagedResultsControl]);
        true.should.equal(false);
      } catch (ex) {
        if (ex instanceof Error) {
          ex.message.should.equal('Should not specify PagedResultsControl');
        } else {
          assert.fail('Exception was not of type Error');
        }
      }
    });
  });

  describe('#searchPaginated', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    before(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    after(async () => {
      await client.unbind();
    });

    it('should paginate', async () => {
      const pageSize = 10;
      const paginator = client.searchPaginated(BASE_DN, {
        filter: 'objectclass=*',
        paged: {
          pageSize,
        },
      });
      let totalResults = 0;
      let iterateCount = 0;
      for await (const searchResult of paginator) {
        iterateCount++;
        totalResults += searchResult.searchEntries.length;
        searchResult.searchEntries.length.should.be.lessThanOrEqual(pageSize);
      }

      iterateCount.should.be.greaterThanOrEqual(1);
      (totalResults / iterateCount).should.be.lessThanOrEqual(pageSize);
    });
  });

  describe('#disposable', () => {
    it('should unbind after disposed', async () => {
      const spy = sinon.spy();

      try {
        await using client = new Client({
          url: LDAP_URI,
        });
        spy(client, 'unbind');
        await client.bind(BIND_DN, BIND_PW);
      } catch {
        /* empty */
      } finally {
        spy.calledOnce.should.equal(true);
      }
    });

    it('should destroy socket after disposed', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      await client[Symbol.asyncDispose]();

      // @ts-expect-error - is private
      should.equal(client.socket, undefined);
    });

    it('should destroy socket after connection failure', async () => {
      const client = new Client({
        connectTimeout: 300,
        url: 'ldap://localhost:9999',
      });

      try {
        // @ts-expect-error - is private
        await client._connect();
      } catch (e) {
        // ignore
      } finally {
        // @ts-expect-error - is private
        should.equal(client.connectTimer, undefined);
        // @ts-expect-error - is private
        should.equal(client.socket, undefined);
      }
    });

    it('should destroy socket after tls connection failure', async () => {
      const client = new Client({
        connectTimeout: 5000,
        url: 'ldaps://localhost:389',
      });

      try {
        // @ts-expect-error - is private
        await client._connect();
      } catch (e) {
        // ignore
      } finally {
        // @ts-expect-error - is private
        should.equal(client.connectTimer, undefined);
        // @ts-expect-error - is private
        should.equal(client.socket, undefined);
      }
    });

    it('should clear timeouts after message resolved/rejected', async () => {
      const client = new Client({
        timeout: 5000,
        connectTimeout: 3000,
        url: LDAP_URI,
      });
      // @ts-expect-error - it is private
      const messageMap = client.messageDetailsByMessageId;
      const messageMapSetter = sinon.spy(messageMap, 'set');

      try {
        await client.bind(BIND_DN, BIND_PW);
      } catch {
        /* empty */
      } finally {
        sinon.assert.calledOnceWithMatch(
          messageMapSetter,
          sinon.match.defined,
          sinon.match((val) => {
            return !!val.timeoutTimer;
          }),
        );

        messageMapSetter.calledOnceWith().should.equal(true);
        messageMap.size.should.equal(0);
      }
    });
  });
});

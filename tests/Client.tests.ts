import assert from 'assert';

import type { BerReader, BerWriter } from 'asn1';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import type { AddRequest, ModifyDNRequest } from '../src/index.js';
import {
  AddResponse,
  AndFilter,
  Attribute,
  Client,
  Control,
  DN,
  EqualityFilter,
  InvalidCredentialsError,
  InvalidDNSyntaxError,
  ModifyDNResponse,
  NoSuchObjectError,
  UndefinedTypeError,
} from '../src/index.js';

describe('Client', () => {
  let should: Chai.Should;
  before(() => {
    should = chai.should();
    chai.use(chaiAsPromised);
  });

  const bindDN = new DN({
    uid: 'tony.stark',
    ou: 'Users',
    // eslint-disable-next-line id-length
    o: '5be4c382c583e54de6a3ff52',
    dc: ['jumpcloud', 'com'],
  }).toString();
  const bindPassword = 'MyRedSuitKeepsMeWarm';

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
        url: 'ldaps://ldap.jumpcloud.com',
      });

      client.isConnected.should.equal(false);
    });
    it('should not be connected after unbind has been called', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);

      client.isConnected.should.equal(true);

      await client.unbind();

      client.isConnected.should.equal(false);
    });
    it('should be connected if a method has been called', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);

      client.isConnected.should.equal(true);

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });
  });
  describe('#bind()', () => {
    it('should succeed on basic bind', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });
    it('should throw for invalid credentials', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      try {
        await client.bind(bindDN, 'AlsoNotAHotdog');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof InvalidCredentialsError).should.equal(true);
      } finally {
        await client.unbind();
      }
    });
    it('should succeed for non-secure bind', async () => {
      // ldapsearch -x -H ldap://ldap.forumsys.com:389 -D "cn=read-only-admin,dc=example,dc=com" -w password -b "dc=example,dc=com" "objectclass=*"
      const client = new Client({
        url: 'ldap://ldap.forumsys.com:389',
      });

      await client.bind('cn=read-only-admin,dc=example,dc=com', 'password');

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }
    });
    it('should bind with a custom control', async () => {
      // Get list of supported controls and extensions:
      // ldapsearch -H ldaps://ldap.jumpcloud.com -b "" -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -s base supportedFeatures supportedControl supportedExtension
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
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword, testControl);

      try {
        await client.unbind();
      } catch {
        // This can fail since it's not the part being tested
      }

      hasWritten.should.equal(true, 'Did not call PasswordPolicyControl#writeControl');
      hasParsed.should.equal(true, 'Did not call PasswordPolicyControl#parseControl');
    });
  });
  describe('#startTLS()', () => {
    it('should upgrade an existing clear-text connection to be secure', async () => {
      const client = new Client({
        url: 'ldap://ldap.jumpcloud.com',
      });

      await client.startTLS();
    });
    it('should use secure connection for subsequent operations', async () => {
      const client = new Client({
        url: 'ldap://ldap.jumpcloud.com',
      });

      await client.startTLS();
      await client.bind(bindDN, bindPassword);
      await client.unbind();
    });
  });
  describe('#unbind()', () => {
    it('should succeed on basic unbind after successful bind', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);
      await client.unbind();
    });
    it('should succeed on if client.bind() was not called previously', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.unbind();
    });
    it('should allow unbind to be called multiple times without error', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);

      await Promise.all([client.unbind(), client.unbind()]);

      await client.unbind();
    });
  });
  describe('#compare()', () => {
    const client: Client = new Client({
      url: 'ldaps://ldap.jumpcloud.com',
    });

    before(async () => {
      await client.bind(bindDN, bindPassword);
    });
    after(async () => {
      await client.unbind();
    });

    it('should return true if entry has the specified attribute and value', async () => {
      const result = await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'sn', 'Banner');
      result.should.equal(true);
    });
    it('should return false if entry does not have the specified attribute and value', async () => {
      const result = await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'sn', 'Stark');
      result.should.equal(false);
    });
    it('should throw if attribute is invalid', async () => {
      try {
        await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'lorem', 'ipsum');
        false.should.equal(true);
      } catch (ex) {
        (ex instanceof UndefinedTypeError).should.equal(true);
      }
    });
    it('should throw if target dn does not exist', async () => {
      try {
        await client.compare('uid=foo.bar,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'uid', 'bruce.banner');
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
  /*  describe('#modify()', () => {
    const client: Client = new Client({
      url: 'ldaps://ldap.jumpcloud.com',
    });

    before(async () => {
      await client.bind(bindDN, bindPassword);
    });
    after(async () => {
      await client.unbind();
    });

    it('should allow updating binary attributes', async () => {
      const thumbnailPhotoBuffer = await fs.readFile(path.join(__dirname, './groot_100.jpg'));
      await client.modify('uid=groot,ou=Users,dc=foo,dc=com', new Change({
        operation: 'replace',
        modification: new Attribute({
          type: 'thumbnailPhoto;binary',
          values: [thumbnailPhotoBuffer]
        }),
      }));
    });
  }); */
  describe('#add()', () => {
    const client: Client = new Client({
      url: 'ldaps://ldap.jumpcloud.com',
    });

    before(async () => {
      await client.bind(bindDN, bindPassword);
    });
    after(async () => {
      await client.unbind();
    });

    it('should allow adding entry with null or undefined attribute value. Issue #88', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const stub = sinon.stub(client, '_send').returns(
        new AddResponse({
          messageId: 123,
        }),
      );

      await client.add('uid=reed.richards,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        userPassword: null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
      url: 'ldaps://ldap.jumpcloud.com',
    });

    before(async () => {
      await client.bind(bindDN, bindPassword);
    });
    after(async () => {
      await client.unbind();
    });

    it('should set newSuperior when newDN is a string and contains a comma', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
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
  });
  describe('#exop()', () => {
    it('should throw if fast bind is not supported', async () => {
      const client: Client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
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

      await client.bind(bindDN, bindPassword);
      await client.unbind();
    });
  });
  describe('#search()', () => {
    const client: Client = new Client({
      url: 'ldaps://ldap.jumpcloud.com',
    });

    before(async () => {
      await client.bind(bindDN, bindPassword);
    });
    after(async () => {
      await client.unbind();
    });

    it('should return search entries with (objectclass=*) if no filter is specified', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(objectclass=*)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com');

      searchResult.searchEntries.length.should.be.greaterThan(0);
    });
    it('should throw error if an operation is performed after the client has closed connection', async () => {
      const testClient = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      try {
        await testClient.bind(bindDN, bindPassword);

        const unbindRequest = testClient.unbind();
        const searchRequest = testClient.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com');
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
    it('should return full search entries if filter="(mail=peter.parker@marvel.com)"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: '(mail=peter.parker@marvel.com)',
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          gidNumber: '5004',
          mail: 'peter.parker@marvel.com',
          memberOf: 'cn=Something (Special),ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          cn: 'Peter Parker',
          jcLdapAdmin: 'TRUE',
          uid: 'peter.parker',
          uidNumber: '5004',
          loginShell: '/bin/bash',
          homeDirectory: '/home/peter.parker',
          givenName: 'Peter',
          sn: 'Parker',
          objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson', 'shadowAccount', 'posixAccount', 'jumpcloudUser'],
        },
      ]);
    });
    it('should return full search entries if filter="(mail=peter.park*)"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: '(mail=peter.park*)',
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          gidNumber: '5004',
          mail: 'peter.parker@marvel.com',
          memberOf: 'cn=Something (Special),ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          cn: 'Peter Parker',
          jcLdapAdmin: 'TRUE',
          uid: 'peter.parker',
          uidNumber: '5004',
          loginShell: '/bin/bash',
          homeDirectory: '/home/peter.parker',
          givenName: 'Peter',
          sn: 'Parker',
          objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson', 'shadowAccount', 'posixAccount', 'jumpcloudUser'],
        },
      ]);
    });
    it('should return parallel search entries if filter="(mail=peter.parker@marvel.com)". Issue #83', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const [result1, result2, result3] = await Promise.all([
        client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
          filter: '(mail=peter.parker@marvel.com)',
        }),
        client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
          filter: '(mail=peter.parker@marvel.com)',
        }),
        client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
          filter: '(mail=peter.parker@marvel.com)',
        }),
      ]);
      const expectedResult = [
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          gidNumber: '5004',
          mail: 'peter.parker@marvel.com',
          memberOf: 'cn=Something (Special),ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          cn: 'Peter Parker',
          jcLdapAdmin: 'TRUE',
          uid: 'peter.parker',
          uidNumber: '5004',
          loginShell: '/bin/bash',
          homeDirectory: '/home/peter.parker',
          givenName: 'Peter',
          sn: 'Parker',
          objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson', 'shadowAccount', 'posixAccount', 'jumpcloudUser'],
        },
      ];

      result1.searchEntries.should.deep.equal(expectedResult);
      result2.searchEntries.should.deep.equal(expectedResult);
      result3.searchEntries.should.deep.equal(expectedResult);
    });
    it('should allow arbitrary controls 1.2.840.113556.1.4.417 to be specified', async () => {
      const searchResult = await client.search(
        'ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
        {
          scope: 'sub',
          filter: '(isDeleted=*)',
        },
        new Control('1.2.840.113556.1.4.417'),
      );

      searchResult.searchEntries.length.should.equal(0);
    });
    it('should return search results for non-secure ldap server', async () => {
      // ldapsearch -x -H ldap://ldap.forumsys.com:389 -D "cn=read-only-admin,dc=example,dc=com" -w password -b "dc=example,dc=com" "uid=einstein"
      const testClient = new Client({
        url: 'ldap://ldap.forumsys.com',
      });

      await testClient.bind('cn=read-only-admin,dc=example,dc=com', 'password');

      try {
        const searchResult = await testClient.search('dc=example,dc=com', {
          filter: '(uid=einstein)',
        });

        searchResult.searchEntries.should.deep.equal([
          {
            cn: 'Albert Einstein',
            dn: 'uid=einstein,dc=example,dc=com',
            mail: 'einstein@ldap.forumsys.com',
            objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
            sn: 'Einstein',
            telephoneNumber: '314-159-2653',
            uid: 'einstein',
          },
        ]);
      } catch (ex) {
        assert.fail('This should not occur');
      } finally {
        await testClient.unbind();
      }
    });
    it('should restrict attributes returned if attributes are specified', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        scope: 'sub',
        filter: '(mail=peter.parker@marvel.com)',
        attributes: ['cn'],
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          cn: 'Peter Parker',
        },
      ]);
    });
    it('should include attributes without values if attributes are specified', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        scope: 'sub',
        filter: '(mail=peter.parker@marvel.com)',
        attributes: ['cn', 'telephoneNumber'],
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          cn: 'Peter Parker',
          telephoneNumber: [],
        },
      ]);
    });
    it('should not return attribute values if returnAttributeValues=false', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -A "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        scope: 'sub',
        filter: '(mail=peter.parker@marvel.com)',
        returnAttributeValues: false,
      });

      searchResult.searchEntries.should.deep.equal([
        {
          dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          gidNumber: [],
          mail: [],
          memberOf: [],
          cn: [],
          jcLdapAdmin: [],
          uid: [],
          uidNumber: [],
          loginShell: [],
          homeDirectory: [],
          givenName: [],
          sn: [],
          objectClass: [],
        },
      ]);
    });
    it('should page search entries if paging is specified', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -E pr=2/noprompt "objectClass=jumpcloudUser"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: 'objectClass=jumpcloudUser',
        paged: {
          pageSize: 2,
        },
      });

      searchResult.searchEntries.length.should.be.greaterThan(2);
    });
    it('should allow sizeLimit when no paging is specified - jumpcloud', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -z 6 'cn=*'
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: 'cn=*',
        sizeLimit: 6,
      });

      searchResult.searchEntries.length.should.equal(6);
    });
    it('should allow sizeLimit when no paging is specified - forumsys', async () => {
      // NOTE: ldapsearch -x -H ldap://ldap.forumsys.com:389 -D "cn=read-only-admin,dc=example,dc=com" -w password -b "dc=example,dc=com" -z 3 'cn=*'
      const testClient = new Client({
        url: 'ldap://ldap.forumsys.com',
      });

      await testClient.bind('cn=read-only-admin,dc=example,dc=com', 'password');

      try {
        const searchResult = await testClient.search('dc=example,dc=com', {
          filter: 'cn=*',
          sizeLimit: 3,
        });

        searchResult.searchEntries.length.should.equal(3);
      } catch (ex) {
        assert.fail('This should not occur');
      } finally {
        await testClient.unbind();
      }
    });
    it('should allow sizeLimit when paging is specified - jumpcloud', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -E pr=3/noprompt -z 5 'cn=*'
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: 'cn=*',
        sizeLimit: 5,
        paged: {
          pageSize: 3,
        },
      });

      searchResult.searchEntries.length.should.equal(5);
    });
    it('should allow sizeLimit when paging is specified - forumsys', async () => {
      // NOTE: ldapsearch -x -H ldap://ldap.forumsys.com:389 -D "cn=read-only-admin,dc=example,dc=com" -w password -b "dc=example,dc=com" -E pr=3/noprompt -z 4 'cn=*'
      const testClient = new Client({
        url: 'ldap://ldap.forumsys.com',
      });

      await testClient.bind('cn=read-only-admin,dc=example,dc=com', 'password');

      try {
        const searchResult = await testClient.search('dc=example,dc=com', {
          filter: 'cn=*',
          sizeLimit: 4,
          paged: {
            pageSize: 3,
          },
        });

        searchResult.searchEntries.length.should.equal(4);
      } catch (ex) {
        assert.fail('This should not occur');
      } finally {
        await testClient.unbind();
      }
    });
    it('should return group contents with parenthesis in name - explicit filter controls', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(&(objectClass=groupOfNames)(cn=Something \28Special\29))"
      const searchResult = await client.search('o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: new AndFilter({
          filters: [
            new EqualityFilter({
              attribute: 'objectClass',
              value: 'groupOfNames',
            }),
            new EqualityFilter({
              attribute: 'cn',
              value: 'Something (Special)',
            }),
          ],
        }),
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'Something (Special)',
          ou: 'Something (Special)',
          dn: 'cn=Something (Special),ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          member: [
            'uid=stan.lee,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
            'uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
            'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          ],
          objectClass: ['top', 'groupOfNames'],
          description: 'tagGroup',
        },
      ]);
    });
    it('should return group contents with parenthesis in name - string filter', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(&(objectClass=groupOfNames)(cn=Something \28Special\29))"
      const searchResult = await client.search('o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: '(&(objectClass=groupOfNames)(cn=Something \\28Special\\29))',
      });

      searchResult.searchEntries.should.deep.equal([
        {
          cn: 'Something (Special)',
          ou: 'Something (Special)',
          dn: 'cn=Something (Special),ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          member: [
            'uid=stan.lee,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
            'uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
            'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
          ],
          objectClass: ['top', 'groupOfNames'],
          description: 'tagGroup',
        },
      ]);
    });
  });
});

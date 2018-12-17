// @ts-ignore
import chai, { should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Client } from '../src';
import { PagedResultsControl } from '../src/controls/PagedResultsControl';
import { InvalidCredentialsError } from '../src/errors/resultCodeErrors/InvalidCredentialsError';
import { UndefinedTypeError } from '../src/errors/resultCodeErrors/UndefinedTypeError';
import { NoSuchObjectError } from '../src/errors/resultCodeErrors/NoSuchObjectError';
import { InvalidDNSyntaxError } from '../src/errors/resultCodeErrors/InvalidDNSyntaxError';

describe('Client', () => {
  before(() => {
    chai.should();
    chai.use(chaiAsPromised);
  });

  const bindDN: string = 'uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com';
  const bindPassword: string = 'MyRedSuitKeepsMeWarm';

  describe('#constructor()', () => {
    it('should throw error if url protocol is not ldap:// or ldaps://', () => {
      const url = 'https://127.0.0.1';
      (() => {
        // tslint:disable-next-line:no-unused-expression
        new Client({
          url,
        });
      }).should.throw(Error, `${url} is an invalid LDAP URL (protocol)`);
    });
    it('should not throw error if url protocol is ldap://', () => {
      const url = 'ldap://127.0.0.1';
      (() => {
        // tslint:disable-next-line:no-unused-expression
        new Client({
          url,
        });
      }).should.not.throw(Error);
    });
    it('should not throw error if url protocol is ldaps://', () => {
      const url = 'ldaps://127.0.0.1';
      (() => {
        // tslint:disable-next-line:no-unused-expression
        new Client({
          url,
        });
      }).should.not.throw(Error);
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

      await Promise.all([
        client.unbind(),
        client.unbind(),
      ]);

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
        // tslint:disable-next-line:no-unused-expression
        (ex instanceof UndefinedTypeError).should.equal(true);
      }
    });
    it('should throw if target dn does not exist', async () => {
      try {
        await client.compare('uid=foo.bar,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'uid', 'bruce.banner');
        false.should.equal(true);
      } catch (ex) {
        // tslint:disable-next-line:no-unused-expression
        (ex instanceof NoSuchObjectError).should.equal(true);
      }
    });
    it('should throw on invalid DN', async () => {
      try {
        await client.compare('foo=bar', 'cn', 'bar');
        false.should.equal(true);
      } catch (ex) {
        // tslint:disable-next-line:no-unused-expression
        (ex instanceof InvalidDNSyntaxError).should.equal(true);
      }
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
        ex.message.should.equal('Connection closed before message response was received. Message type: SearchRequest (0x63)');
      } finally {
        await testClient.unbind();
      }
    });
    it('should return full search entries if filter="(mail=peter.parker@marvel.com)"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: '(mail=peter.parker@marvel.com)',
      });

      searchResult.searchEntries.should.deep.equal([{
        dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
        gidNumber: '5004',
        mail: 'peter.parker@marvel.com',
        cn: 'Peter Parker',
        jcLdapAdmin: 'TRUE',
        uid: 'peter.parker',
        uidNumber: '5004',
        loginShell: '/bin/bash',
        homeDirectory: '/home/peter.parker',
        givenName: 'Peter',
        sn: 'Parker',
        objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson', 'shadowAccount', 'posixAccount', 'jumpcloudUser'],
      }]);
    });
    it('should restrict attributes returned if attributes are specified"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        scope: 'sub',
        filter: '(mail=peter.parker@marvel.com)',
        attributes: ['cn'],
      });

      searchResult.searchEntries.should.deep.equal([{
        dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
        cn: 'Peter Parker',
      }]);
    });
    it('should not return attribute values if returnAttributeValues=false"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -A "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        scope: 'sub',
        filter: '(mail=peter.parker@marvel.com)',
        returnAttributeValues: false,
      });

      searchResult.searchEntries.should.deep.equal([{
        dn: 'uid=peter.parker,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com',
        gidNumber: [],
        mail: [],
        cn: [],
        jcLdapAdmin: [],
        uid: [],
        uidNumber: [],
        loginShell: [],
        homeDirectory: [],
        givenName: [],
        sn: [],
        objectClass: [],
      }]);
    });
    it('should page search entries if paging is specified"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -E pr=2/noprompt "objectClass=jumpcloudUser"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: 'objectClass=jumpcloudUser',
        paged: {
          pageSize: 2,
        },
      });

      searchResult.searchEntries.length.should.be.greaterThan(2);
    });
    it('should throw if a PagedResultsControl is specified', () => {
      const pagedResultsControl = new PagedResultsControl({});
      client.search('cn=test', {}, pagedResultsControl).should.be.rejectedWith(Error, 'Should not specify PagedResultsControl');
    });
    it('should throw if a PagedResultsControl is specified in the controls array', () => {
      const pagedResultsControl = new PagedResultsControl({});
      client.search('cn=test', {}, [pagedResultsControl]).should.be.rejectedWith(Error, 'Should not specify PagedResultsControl');
    });
  });
});

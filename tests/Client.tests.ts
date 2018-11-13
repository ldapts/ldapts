import chai, { should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Client } from '../src';
import { InvalidCredentialsError } from '../src/errors/InvalidCredentialsError';
import { CompareError } from '../src/errors/CompareError';
import { PagedResultsControl } from '../src/controls/PagedResultsControl';

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
        (ex instanceof CompareError).should.equal(true);
      }
    });
    it('should throw if target dn does not exist', async () => {
      try {
        await client.compare('uid=foo.bar,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'uid', 'bruce.banner');
        false.should.equal(true);
      } catch (ex) {
        // tslint:disable-next-line:no-unused-expression
        (ex instanceof CompareError).should.equal(true);
      }
    });
    it('should throw on unknown error', async () => {
      try {
        await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'foo', 'bar');
        false.should.equal(true);
      } catch (ex) {
        // tslint:disable-next-line:no-unused-expression
        (ex instanceof CompareError).should.equal(true);
        (ex.message).should.equal('Unknown error: 0x11');
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
    it('should return search entries if filter="(objectclass=*)"', async () => {
      // NOTE: ldapsearch -H ldaps://ldap.jumpcloud.com -b ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -x -D uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(objectclass=*)"
      const searchResult = await client.search('ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', {
        filter: '(objectclass=*)',
      });

      searchResult.searchEntries.length.should.be.greaterThan(0);
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

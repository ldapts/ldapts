import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from "chai-as-promised";
import { Client } from '../src';
import {InvalidCredentialsError} from "../src/errors/InvalidCredentialsError";
import {CompareError} from "../src/errors/CompareError";

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
      expect(() => {
        new Client({
          url,
        });
      }).to.throw(Error, `${url} is an invalid LDAP URL (protocol)`);
    });
    it('should not throw error if url protocol is ldap://', () => {
      const url = 'ldap://127.0.0.1';
      expect(() => {
        new Client({
          url,
        });
      }).to.not.throw(Error);
    });
    it('should not throw error if url protocol is ldaps://', () => {
      const url = 'ldaps://127.0.0.1';
      expect(() => {
        new Client({
          url,
        });
      }).to.not.throw(Error);
    });
  });
  describe('#bind()', () => {
    it('should succeed on basic bind', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      await client.bind(bindDN, bindPassword);

      try {
        // This can fail since it's not the part being tested
        await client.unbind();
      } catch {}
    });
    it('should throw for invalid credentials', async () => {
      const client = new Client({
        url: 'ldaps://ldap.jumpcloud.com',
      });

      try {
        await client.bind(bindDN, 'AlsoNotAHotdog');
        expect(false).to.be.true;
      } catch (ex) {
        expect(ex instanceof InvalidCredentialsError).to.be.true;
      }
      finally {
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
    let client: Client = new Client({
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
      expect(result).to.be.true;
    });
    it('should return false if entry does not have the specified attribute and value', async () => {
      const result = await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'sn', 'Stark');
      expect(result).to.be.false;
    });
    it('should throw if attribute is invalid', async () => {
      try {
        await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'lorem', 'ipsum');
        expect(false).to.be.true;
      } catch (ex) {
        expect(ex instanceof CompareError).to.be.true;
      }
    });
    it('should throw if target dn does not exist', async () => {
      try {
        await client.compare('uid=foo.bar,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'uid', 'bruce.banner');
        expect(false).to.be.true;
      } catch (ex) {
        expect(ex instanceof CompareError).to.be.true;
      }
    });
    it('should throw on unknown error', async () => {
      try {
        await client.compare('uid=bruce.banner,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com', 'foo', 'bar');
        expect(false).to.be.true;
      } catch (ex) {
        expect(ex instanceof CompareError).to.be.true;
        expect(ex.message).to.equal('Unknown error: 0x11');
      }
    });
  })
});

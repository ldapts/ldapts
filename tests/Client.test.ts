import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { type BerReader, type BerWriter } from '../src/ber/index.js';
import { type AddRequest, type ModifyDNRequest } from '../src/index.js';
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

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

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
      expect((): void => {
        new Client({
          url,
        });
      }).toThrow(`${url} is an invalid LDAP URL (protocol)`);
    });

    it('should not throw error if url protocol is ldap://', () => {
      const url = 'ldap://127.0.0.1';
      expect((): void => {
        new Client({
          url,
        });
      }).not.toThrow();
    });

    it('should not throw error if url protocol is ldaps://', () => {
      const url = 'ldaps://127.0.0.1';
      expect((): void => {
        new Client({
          url,
        });
      }).not.toThrow();
    });

    it('should not enable secure mode with empty tlsOptions object', () => {
      const client = new Client({
        url: 'ldap://127.0.0.1',
        tlsOptions: {},
      });

      // @ts-expect-error - private field
      expect(client.secure).toBe(false);
    });

    it('should not enable secure mode with tlsOptions containing only undefined values', () => {
      const client = new Client({
        url: 'ldap://127.0.0.1',
        tlsOptions: {
          rejectUnauthorized: undefined,
          ca: undefined,
        },
      });

      // @ts-expect-error - private field
      expect(client.secure).toBe(false);
    });

    it('should enable secure mode with tlsOptions containing defined values', () => {
      const client = new Client({
        url: 'ldap://127.0.0.1',
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      // @ts-expect-error - private field
      expect(client.secure).toBe(true);
    });

    it('should enable secure mode with ldaps:// even with empty tlsOptions', () => {
      const client = new Client({
        url: 'ldaps://127.0.0.1',
        tlsOptions: {},
      });

      // @ts-expect-error - private field
      expect(client.secure).toBe(true);
    });

    // URL parsing tests to ensure native URL class handles all cases correctly
    describe('URL parsing', () => {
      it('should parse ldap URL with explicit port', () => {
        const client = new Client({
          url: 'ldap://localhost:389',
        });

        // @ts-expect-error - private field
        expect(client.host).toBe('localhost');
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
        // @ts-expect-error - private field
        expect(client.secure).toBe(false);
      });

      it('should parse ldaps URL with explicit port', () => {
        const client = new Client({
          url: 'ldaps://localhost:636',
        });

        // @ts-expect-error - private field
        expect(client.host).toBe('localhost');
        // @ts-expect-error - private field
        expect(client.port).toBe(636);
        // @ts-expect-error - private field
        expect(client.secure).toBe(true);
      });

      it('should use default port 389 for ldap URL without port', () => {
        const client = new Client({
          url: 'ldap://localhost',
        });

        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });

      it('should use default port 636 for ldaps URL without port', () => {
        const client = new Client({
          url: 'ldaps://localhost',
        });

        // @ts-expect-error - private field
        expect(client.port).toBe(636);
      });

      it('should parse IPv4 address', () => {
        const client = new Client({
          url: 'ldap://192.168.1.1:389',
        });

        // @ts-expect-error - private field
        expect(client.host).toBe('192.168.1.1');
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });

      it('should parse IPv6 address with brackets', () => {
        const client = new Client({
          url: 'ldap://[::1]:389',
        });

        // @ts-expect-error - private field
        // IPv6 can be represented as '::1' or '0:0:0:0:0:0:0:1' - both are valid
        expect(client.host).toMatch(/^(:{2}1|(?:0:){7}1)$/);
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });

      it('should parse full IPv6 address', () => {
        const client = new Client({
          url: 'ldap://[2001:db8:85a3::8a2e:370:7334]:389',
        });

        // @ts-expect-error - private field
        // The host should be a valid representation of the IPv6 address (compressed or expanded)
        expect(typeof client.host).toBe('string');
        // @ts-expect-error - private field
        expect(client.host.length).toBeGreaterThan(0);
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });

      it('should parse IPv6 address without port', () => {
        const client = new Client({
          url: 'ldap://[::1]',
        });

        // @ts-expect-error - private field
        expect(client.host).toMatch(/^(:{2}1|(?:0:){7}1)$/);
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });

      it('should parse hostname with subdomain', () => {
        const client = new Client({
          url: 'ldap://ldap.example.com:389',
        });

        // @ts-expect-error - private field
        expect(client.host).toBe('ldap.example.com');
      });

      it('should use custom port when specified', () => {
        const client = new Client({
          url: 'ldap://localhost:1389',
        });

        // @ts-expect-error - private field
        expect(client.port).toBe(1389);
      });

      it('should throw error for http:// protocol', () => {
        expect((): void => {
          new Client({
            url: 'http://localhost:389',
          });
        }).toThrow('http://localhost:389 is an invalid LDAP URL (protocol)');
      });

      it('should throw error for https:// protocol', () => {
        expect((): void => {
          new Client({
            url: 'https://localhost:389',
          });
        }).toThrow('https://localhost:389 is an invalid LDAP URL (protocol)');
      });

      it('should throw error for ftp:// protocol', () => {
        expect((): void => {
          new Client({
            url: 'ftp://localhost:389',
          });
        }).toThrow('ftp://localhost:389 is an invalid LDAP URL (protocol)');
      });

      it('should throw error for malformed URL', () => {
        expect((): void => {
          new Client({
            url: 'not-a-valid-url',
          });
        }).toThrow('not-a-valid-url is an invalid LDAP URL (protocol)');
      });

      it('should throw error for empty URL', () => {
        expect((): void => {
          new Client({
            url: '',
          });
        }).toThrow(' is an invalid LDAP URL (protocol)');
      });

      it('should handle URL with empty host', () => {
        // ldap:/// is a valid URL format - behavior may vary
        // The client should not throw and should have a valid host
        const client = new Client({
          url: 'ldap:///',
        });

        // @ts-expect-error - private field
        expect(typeof client.host).toBe('string');
        // @ts-expect-error - private field
        expect(client.port).toBe(389);
      });
    });
  });

  describe('#isConnected', () => {
    it('should not be connected if a method has not been called', () => {
      const client = new Client({
        url: LDAP_URI,
      });

      expect(client.isConnected).toBe(false);
    });

    it('should not be connected after unbind has been called', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      expect(client.isConnected).toBe(true);

      await client.unbind();

      expect(client.isConnected).toBe(false);
    });

    it('should be connected if a method has been called', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      expect(client.isConnected).toBe(true);

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

      expect(client.isConnected).toBe(false);
      await client.bind(BIND_DN, BIND_PW);
      expect(client.isConnected).toBe(true);
      await client.unbind();
      expect(client.isConnected).toBe(false);

      await client.bind(BIND_DN, BIND_PW);
      expect(client.isConnected).toBe(true);
      await client.unbind();
      expect(client.isConnected).toBe(false);
    });
  });

  describe('#bind()', () => {
    it('should succeed on basic bind', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await expect(client.bind(BIND_DN, BIND_PW)).resolves.toBeUndefined();

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
      expect(client.secure).toBe(true);
      await client.bind(BIND_DN, BIND_PW);
    });

    it('should throw for invalid credentials', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await expect(client.bind(BIND_DN, 'AlsoNotAHotdog')).rejects.toBeInstanceOf(InvalidCredentialsError);
      await client.unbind();
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

      await expect(client.bind('EXTERNAL')).resolves.toBeUndefined();

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
        expect.unreachable('Exception expected');
      } catch {
        // surely will happen
      }

      expect(hasWritten).toBe(true);
      expect(hasParsed).toBe(true);
    });
  });

  describe('#startTLS()', () => {
    it('should upgrade an existing clear-text connection to be secure', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await expect(client.startTLS()).resolves.toBeUndefined();
    });

    it('should use secure connection for subsequent operations', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.startTLS();
      await client.bind(BIND_DN, BIND_PW);
      await expect(client.unbind()).resolves.toBeUndefined();
    });
  });

  describe('#unbind()', () => {
    it('should succeed on basic unbind after successful bind', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      await expect(client.unbind()).resolves.toBeUndefined();
    });

    it('should succeed if client.bind() was not called previously', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await expect(client.unbind()).resolves.toBeUndefined();
    });

    it('should allow unbind to be called multiple times without error', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);

      await Promise.all([client.unbind(), client.unbind()]);

      await expect(client.unbind()).resolves.toBeUndefined();
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
      } catch {
        // ignore
      } finally {
        // @ts-expect-error - is private
        expect(client.connectTimer).toBeUndefined();
        // @ts-expect-error - is private
        expect(client.socket).toBeUndefined();
      }
    });
  });

  describe('#compare()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
      await client.unbind();
    });

    it('should return true if entry has the specified attribute and value', async () => {
      const result = await client.compare(`uid=user1,${BASE_DN}`, 'sn', 'SURNAME');
      expect(result).toBe(true);
    });

    it('should return false if entry does not have the specified attribute and value', async () => {
      const result = await client.compare(`uid=user1,${BASE_DN}`, 'sn', 'Stark');
      expect(result).toBe(false);
    });

    it('should throw if attribute is invalid', async () => {
      await expect(client.compare(`uid=user1,${BASE_DN}`, 'lorem', 'ipsum')).rejects.toBeInstanceOf(UndefinedTypeError);
    });

    it('should throw if target dn does not exist', async () => {
      await expect(client.compare(`uid=foo.bar,${BASE_DN}`, 'uid', 'bruce.banner')).rejects.toBeInstanceOf(NoSuchObjectError);
    });

    it('should throw on invalid DN', async () => {
      await expect(client.compare('foo=bar', 'cn', 'bar')).rejects.toBeInstanceOf(InvalidDNSyntaxError);
    });
  });

  describe('#modify()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
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
      expect(searchEntries).toHaveLength(1);
      expect(searchEntries[0]).toHaveProperty('mail', `four@${LDAP_DOMAIN}`);
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
      expect(searchEntries2).toHaveLength(1);
      expect(searchEntries2[0]).toHaveProperty('mail', `user4@${LDAP_DOMAIN}`);
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

      expect(searchEntries).toHaveLength(1);
      expect(searchEntries[0]?.['mail']).toContain(`four@${LDAP_DOMAIN}`);
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
      expect(searchEntries).toHaveLength(1);
      expect(searchEntries[0]).toHaveProperty('mail', `user4@${LDAP_DOMAIN}`);
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
      expect(searchEntries2).toHaveLength(1);
      expect(searchEntries2[0]?.['jpegPhoto']).toStrictEqual(jpegPhotoBuffer);
    });
  });

  describe('#add()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
      await client.unbind();
    });

    it('should allow adding entry with null or undefined attribute value. Issue #88', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = vi.spyOn(client as any, '_send').mockResolvedValue(
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

      expect(stub).toHaveBeenCalledOnce();
      const args = stub.mock.calls[0]![0] as AddRequest;
      expect(args.attributes).toStrictEqual([
        new Attribute({
          type: 'userPassword',
          values: [],
        }),
        new Attribute({
          type: 'foo',
          values: [],
        }),
      ]);
      stub.mockRestore();
    });
  });

  describe('#modifyDN()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
      await client.unbind();
    });

    it('should set newSuperior when newDN is a string and contains a comma', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = vi.spyOn(client as any, '_send').mockResolvedValue(
        new ModifyDNResponse({
          messageId: 123,
        }),
      );

      const dn = 'uid=groot,ou=Users,dc=foo,dc=com';
      const newRdn = 'uid=new-groot';
      const newSuperior = 'ou=Users,dc=foo,dc=com';
      const newDN = `${newRdn},${newSuperior}`;
      await client.modifyDN(dn, newDN);

      expect(stub).toHaveBeenCalledOnce();
      const args = stub.mock.calls[0]![0] as ModifyDNRequest;
      expect(args.dn).toBe(dn);
      expect(args.deleteOldRdn).toBe(true);
      expect(args.newRdn).toBe(newRdn);
      expect(args.newSuperior).toBe(newSuperior);
      expect(args.controls).toBeUndefined();
      stub.mockRestore();
    });

    it('should handle escaped comma in newDN. Issue #87', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = vi.spyOn(client as any, '_send').mockResolvedValue(
        new ModifyDNResponse({
          messageId: 123,
        }),
      );

      const dn = 'uid=groot,ou=Users,dc=foo,dc=com';
      const newRdn = 'uid=new\\,groot';
      const newSuperior = 'ou=Users,dc=foo,dc=com';
      const newDN = `${newRdn},${newSuperior}`;
      await client.modifyDN(dn, newDN);

      expect(stub).toHaveBeenCalledOnce();
      const args = stub.mock.calls[0]![0] as ModifyDNRequest;
      expect(args.dn).toBe(dn);
      expect(args.deleteOldRdn).toBe(true);
      expect(args.newRdn).toBe(newRdn);
      expect(args.newSuperior).toBe(newSuperior);
      expect(args.controls).toBeUndefined();
      stub.mockRestore();
    });

    it('should handle newSuperior with the long form', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = vi.spyOn(client as any, '_send').mockResolvedValue(
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

      expect(stub).toHaveBeenCalledOnce();
      const args = stub.mock.calls[0]![0] as ModifyDNRequest;
      expect(args.dn).toBe(dn);
      expect(args.deleteOldRdn).toBe(true);
      expect(args.newRdn).toBe(newRdn);
      expect(args.newSuperior).toBe(newSuperior);
      expect(args.controls).toBeUndefined();
      stub.mockRestore();
    });
  });

  describe('#exop()', () => {
    it('should throw if fast bind is not supported', async () => {
      const client: Client = new Client({
        url: LDAP_URI,
      });

      await expect(client.exop('1.2.840.113556.1.4.1781')).rejects.toThrow('unsupported extended operation Code: 0x2');

      await client.bind(BIND_DN, BIND_PW);
      await client.unbind();
    });
  });

  describe('#search()', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
      await client.unbind();
    });

    it('should return search entries with (objectclass=*) if no filter is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(objectclass=*)"
      const searchResult = await client.search(BASE_DN);

      expect(searchResult.searchEntries.length).toBeGreaterThan(0);
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
        await expect(searchRequest).rejects.toThrow('Connection closed before message response was received. Message type: SearchRequest (0x63)');
      } finally {
        await testClient.unbind();
      }
    });

    it('should return full search entries if filter="(mail=user1@ldap.local)"', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)"
      const searchResult = await client.search(BASE_DN, {
        filter: `(mail=user1@${LDAP_DOMAIN})`,
      });

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(result1.searchEntries).toStrictEqual(expectedResult);
      expect(result2.searchEntries).toStrictEqual(expectedResult);
      expect(result3.searchEntries).toStrictEqual(expectedResult);
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

      expect(searchResult.searchEntries.length).toBe(0);
    });

    it('should restrict attributes returned if attributes are specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm "(mail=peter.parker@marvel.com)" "cn"
      const searchResult = await client.search(BASE_DN, {
        scope: 'sub',
        filter: `(mail=user1@${LDAP_DOMAIN})`,
        attributes: ['cn'],
      });

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries.length).toBeGreaterThan(2);
    });

    it('should allow sizeLimit when no paging is specified', async () => {
      // NOTE: ldapsearch -H ldaps://localhost:636 -b dc=jumpcloud,dc=com -x -D uid=tony.stark,dc=jumpcloud,dc=com -w MyRedSuitKeepsMeWarm -z 6 'cn=*'
      const searchResult = await client.search(BASE_DN, {
        filter: 'cn=*',
        sizeLimit: 3,
      });

      expect(searchResult.searchEntries.length).toBe(3);
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

      expect(searchResult.searchEntries.length).toBe(5);
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

      expect(searchResult.searchEntries).toStrictEqual([
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

      expect(searchResult.searchEntries).toStrictEqual([
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
      await expect(client.search('cn=test', {}, pagedResultsControl)).rejects.toThrow('Should not specify PagedResultsControl');
    });

    it('should throw if a PagedResultsControl is specified in the controls array', async () => {
      const pagedResultsControl = new PagedResultsControl({});
      await expect(client.search('cn=test', {}, [pagedResultsControl])).rejects.toThrow('Should not specify PagedResultsControl');
    });
  });

  describe('#searchPaginated', () => {
    const client: Client = new Client({
      url: LDAP_URI,
    });

    beforeAll(async () => {
      await client.bind(BIND_DN, BIND_PW);
    });

    afterAll(async () => {
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
        expect(searchResult.searchEntries.length).toBeLessThanOrEqual(pageSize);
      }

      expect(iterateCount).toBeGreaterThanOrEqual(1);
      expect(totalResults / iterateCount).toBeLessThanOrEqual(pageSize);
    });
  });

  describe('#disposable', () => {
    it('should unbind after disposed', async () => {
      const spy = vi.fn();

      try {
        await using client = new Client({
          url: LDAP_URI,
        });
        spy(client, 'unbind');
        await client.bind(BIND_DN, BIND_PW);
      } catch {
        /* empty */
      } finally {
        expect(spy).toHaveBeenCalledOnce();
      }
    });

    it('should destroy socket after disposed', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      await client[Symbol.asyncDispose]();

      // @ts-expect-error - is private
      expect(client.socket).toBeUndefined();
    });

    it('should destroy socket after connection failure', async () => {
      const client = new Client({
        connectTimeout: 300,
        url: 'ldap://localhost:9999',
      });

      try {
        // @ts-expect-error - is private
        await client._connect();
      } catch {
        // ignore
      } finally {
        // @ts-expect-error - is private
        expect(client.connectTimer).toBeUndefined();
        // @ts-expect-error - is private
        expect(client.socket).toBeUndefined();
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
      } catch {
        // ignore
      } finally {
        // @ts-expect-error - is private
        expect(client.connectTimer).toBeUndefined();
        // @ts-expect-error - is private
        expect(client.socket).toBeUndefined();
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
      const messageMapSetter = vi.spyOn(messageMap, 'set');

      try {
        await client.bind(BIND_DN, BIND_PW);
      } catch {
        /* empty */
      } finally {
        expect(messageMapSetter).toHaveBeenCalledOnce();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setCalls = messageMapSetter.mock.calls as any[];
        expect(setCalls[0][0]).toBeDefined();
        expect(setCalls[0][1].timeoutTimer).toBeTruthy();

        expect(messageMap.size).toBe(0);
      }
    });
  });
});

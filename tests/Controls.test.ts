import { describe, expect, it } from 'vite-plus/test';

import { BerReader, BerWriter } from '../src/ber/index.js';
import { Attribute, Change, Client, ControlParser, PasswordPolicyControl, PasswordPolicyError, type PasswordPolicyValue, ServerSideSortingRequestControl } from '../src/index.js';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

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

      expect(results[0]).toBe(results.sort()[0]);
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

      expect(results[0]).toBe(results.sort().reverse()[0]);
    });
  });

  describe('PasswordPolicyControl', () => {
    function parseValue(bytes: number[]): PasswordPolicyControl {
      const control = new PasswordPolicyControl();
      control.parse(new BerReader(Buffer.from(bytes)));
      return control;
    }

    function roundTrip(control: PasswordPolicyControl): PasswordPolicyValue | undefined {
      const writer = new BerWriter();
      control.write(writer);

      const parsed = ControlParser.parse(new BerReader(writer.buffer), [new PasswordPolicyControl()]);
      expect(parsed).toBeInstanceOf(PasswordPolicyControl);

      return parsed instanceof PasswordPolicyControl ? parsed.value : undefined;
    }

    it('should parse a timeBeforeExpiration warning', () => {
      const { value } = parseValue([0x30, 0x05, 0xa0, 0x03, 0x80, 0x01, 0x1e]);

      expect(value).toStrictEqual({ timeBeforeExpiration: 30 });
    });

    it('should parse a graceAuthNsRemaining warning', () => {
      const { value } = parseValue([0x30, 0x05, 0xa0, 0x03, 0x81, 0x01, 0x02]);

      expect(value).toStrictEqual({ graceAuthNsRemaining: 2 });
    });

    it('should parse an error', () => {
      const { value } = parseValue([0x30, 0x03, 0x81, 0x01, 0x01]);

      expect(value).toStrictEqual({ error: PasswordPolicyError.AccountLocked });
    });

    it('should parse a warning and an error', () => {
      const { value } = parseValue([0x30, 0x08, 0xa0, 0x03, 0x81, 0x01, 0x01, 0x81, 0x01, 0x00]);

      expect(value).toStrictEqual({ graceAuthNsRemaining: 1, error: PasswordPolicyError.PasswordExpired });
    });

    it('should parse a response without a warning or an error', () => {
      const { value } = parseValue([0x30, 0x00]);

      expect(value).toStrictEqual({});
    });

    it('should leave value unset when the response has no control value', () => {
      const { value } = parseValue([]);

      expect(value).toBeUndefined();
    });

    it('should write a request without a control value', () => {
      expect(roundTrip(new PasswordPolicyControl())).toBeUndefined();
    });

    it('should write each warning and error it can parse', () => {
      for (const value of [{ timeBeforeExpiration: 30 }, { graceAuthNsRemaining: 2 }, { error: PasswordPolicyError.PasswordTooShort }, {}]) {
        expect(roundTrip(new PasswordPolicyControl({ value }))).toStrictEqual(value);
      }
    });

    it('should be populated from a bind response', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      const control = new PasswordPolicyControl();
      await client.bind(`uid=user2,${BASE_DN}`, BIND_PW, control);
      await client.unbind();

      expect(control.value).toStrictEqual({});
    });

    it('should be populated from a failed password change', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      const control = new PasswordPolicyControl();
      await client.bind(`uid=user2,${BASE_DN}`, BIND_PW);

      await expect(
        client.modify(
          `uid=user2,${BASE_DN}`,
          new Change({
            operation: 'replace',
            modification: new Attribute({
              type: 'userPassword',
              values: ['abc'],
            }),
          }),
          control,
        ),
      ).rejects.toThrow('Password fails quality checking policy');

      await client.unbind();

      expect(control.value).toStrictEqual({ error: PasswordPolicyError.PasswordTooShort });
    });
  });
});

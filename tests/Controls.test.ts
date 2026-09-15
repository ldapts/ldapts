import { describe, expect, it } from 'vite-plus/test';

import { Ber, BerReader, BerWriter } from '../src/ber/index.js';
import { Attribute, Change, Client, Control, ControlParser, PasswordPolicyControl, PasswordPolicyError, type PasswordPolicyValue, ServerSideSortingRequestControl } from '../src/index.js';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const LDAP_URI = 'ldap://localhost:389';
const BASE_DN = 'dc=ldap,dc=local';
const BIND_DN = `cn=admin,${BASE_DN}`;
const BIND_PW = '1234';

function writeResponseControl(type: string, value: number[]): BerReader {
  const writer = new BerWriter();
  writer.startSequence();
  writer.writeString(type);
  writer.writeBoolean(false);
  if (value.length) {
    writer.writeBuffer(Buffer.from(value), Ber.OctetString);
  }

  writer.endSequence();
  return new BerReader(writer.buffer);
}

describe('Controls', () => {
  describe('Control', () => {
    it('should default responseType to the request type', () => {
      expect(new Control('1.2.3').responseType).toBe('1.2.3');
    });

    it('should route a response sent under responseType to the request control', () => {
      const control = new Control('1.2.3', { responseType: '4.5.6' });

      expect(ControlParser.parse(writeResponseControl('4.5.6', []), [control])).toBe(control);
    });

    it('should not route a response sent under the request type when responseType differs', () => {
      const control = new Control('1.2.3', { responseType: '4.5.6' });

      expect(ControlParser.parse(writeResponseControl('1.2.3', []), [control])).toBeNull();
    });
  });

  describe('ServerSideSortingRequestControl', () => {
    it('should sort values', async () => {
      const client = new Client({
        url: LDAP_URI,
      });

      await client.bind(BIND_DN, BIND_PW);
      const control = new ServerSideSortingRequestControl({
        value: { reverseOrder: false, attributeType: 'uid', orderingRule: 'caseIgnoreOrderingMatch' },
      });
      const res = await client.search(
        BASE_DN,
        {
          filter: 'uid=*',
          attributes: ['uid'],
        },
        control,
      );
      const results = res.searchEntries.map((entry) => entry['uid']) as [string, ...string[]];

      expect(results[0]).toBe(results.sort()[0]);
      expect(control.result).toStrictEqual({ sortResult: 0 });
    });

    it('should parse a successful sort result sent under the response OID', () => {
      const control = new ServerSideSortingRequestControl();
      const parsed = ControlParser.parse(writeResponseControl(ServerSideSortingRequestControl.responseType, [0x30, 0x03, 0x0a, 0x01, 0x00]), [control]);

      expect(parsed).toBe(control);
      expect(control.result).toStrictEqual({ sortResult: 0 });
    });

    it('should parse a failed sort result with the offending attribute', () => {
      const control = new ServerSideSortingRequestControl();
      ControlParser.parse(writeResponseControl(ServerSideSortingRequestControl.responseType, [0x30, 0x08, 0x0a, 0x01, 0x35, 0x80, 0x03, 0x75, 0x69, 0x64]), [control]);

      expect(control.result).toStrictEqual({ sortResult: 53, attributeType: 'uid' });
    });

    it('should still parse a request value', () => {
      const writer = new BerWriter();
      new ServerSideSortingRequestControl({ value: { attributeType: 'uid', orderingRule: 'caseIgnoreOrderingMatch', reverseOrder: true } }).write(writer);
      const parsed = ControlParser.parse(new BerReader(writer.buffer), []);

      expect(parsed).toBeInstanceOf(ServerSideSortingRequestControl);
      expect(parsed instanceof ServerSideSortingRequestControl ? parsed.values : []).toStrictEqual([{ attributeType: 'uid', orderingRule: 'caseIgnoreOrderingMatch', reverseOrder: true }]);
      expect(parsed instanceof ServerSideSortingRequestControl ? parsed.result : null).toBeUndefined();
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

import { type BerReader } from '../ber/index.js';
import { BerWriter } from '../ber/index.js';

import { type ControlOptions } from './Control.js';
import { Control } from './Control.js';

/**
 * Values of {@link PasswordPolicyValue.error}
 */
export const PasswordPolicyError = {
  PasswordExpired: 0,
  AccountLocked: 1,
  ChangeAfterReset: 2,
  PasswordModNotAllowed: 3,
  MustSupplyOldPassword: 4,
  InsufficientPasswordQuality: 5,
  PasswordTooShort: 6,
  PasswordTooYoung: 7,
  PasswordInHistory: 8,
} as const;

export interface PasswordPolicyValue {
  /**
   * Seconds until the password expires. Mutually exclusive with `graceAuthNsRemaining`.
   */
  timeBeforeExpiration?: number;
  /**
   * Number of grace authentications left after the password expired. Mutually exclusive with `timeBeforeExpiration`.
   */
  graceAuthNsRemaining?: number;
  /**
   * Reason the operation was refused or the account is unusable. See {@link PasswordPolicyError}. Servers may send
   * codes outside of that list.
   */
  error?: number;
}

export interface PasswordPolicyControlOptions extends ControlOptions {
  value?: PasswordPolicyValue;
}

/**
 * Password policy control (draft-behera-ldap-password-policy). Send an instance without a value along with a `bind()`
 * or `modify()` request, then read `value` from that same instance once the operation settles - it is populated from
 * the server response, including when the operation throws. Sending the control again clears `value` first, so a
 * reused instance only ever shows the latest response.
 */
export class PasswordPolicyControl extends Control {
  public static type = '1.3.6.1.4.1.42.2.27.8.5.1';

  public value?: PasswordPolicyValue;

  public constructor(options: PasswordPolicyControlOptions = {}) {
    super(PasswordPolicyControl.type, options);

    this.value = options.value;
  }

  public override parseControl(reader: BerReader): void {
    if (!reader.readSequence()) {
      return;
    }

    const value: PasswordPolicyValue = {};

    // graceAuthNsRemaining and error share the 0x81 tag, so the warning choice is only reachable inside the 0xa0 wrapper
    if (reader.peek() === 0xa0) {
      reader.readSequence(0xa0);
      if (reader.peek() === 0x80) {
        value.timeBeforeExpiration = reader.readTag(0x80) ?? 0;
      } else if (reader.peek() === 0x81) {
        value.graceAuthNsRemaining = reader.readTag(0x81) ?? 0;
      }
    }

    if (reader.peek() === 0x81) {
      value.error = reader.readTag(0x81) ?? 0;
    }

    this.value = value;
  }

  public override writeControl(writer: BerWriter): void {
    const { value } = this;
    // The response lands in `value`, so drop whatever the previous operation left there
    this.value = undefined;

    if (!value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();

    if (typeof value.timeBeforeExpiration === 'number') {
      controlWriter.startSequence(0xa0);
      controlWriter.writeInt(value.timeBeforeExpiration, 0x80);
      controlWriter.endSequence();
    } else if (typeof value.graceAuthNsRemaining === 'number') {
      controlWriter.startSequence(0xa0);
      controlWriter.writeInt(value.graceAuthNsRemaining, 0x81);
      controlWriter.endSequence();
    }

    if (typeof value.error === 'number') {
      controlWriter.writeEnumeration(value.error, 0x81);
    }

    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}

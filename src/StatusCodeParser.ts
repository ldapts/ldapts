import { ResultCodeError } from './errors/resultCodeErrors/ResultCodeError';
import { OperationsError } from './errors/resultCodeErrors/OperationsError';
import { UnknownStatusCodeError } from './errors/resultCodeErrors/UnknownStatusCodeError';
import { ProtocolError } from './errors/resultCodeErrors/ProtocolError';
import { TimeLimitExceededError } from './errors/resultCodeErrors/TimeLimitExceededError';
import { SizeLimitExceededError } from './errors/resultCodeErrors/SizeLimitExceededError';
import { AuthMethodNotSupportedError } from './errors/resultCodeErrors/AuthMethodNotSupportedError';
import { StrongAuthRequiredError } from './errors/resultCodeErrors/StrongAuthRequiredError';
import { AdminLimitExceededError } from './errors/resultCodeErrors/AdminLimitExceededError';
import { UnavailableCriticalExtensionError } from './errors/resultCodeErrors/UnavailableCriticalExtensionError';
import { ConfidentialityRequiredError } from './errors/resultCodeErrors/ConfidentialityRequiredError';
import { NoSuchAttributeError } from './errors/resultCodeErrors/NoSuchAttributeError';
import { UndefinedTypeError } from './errors/resultCodeErrors/UndefinedTypeError';
import { InappropriateMatchingError } from './errors/resultCodeErrors/InappropriateMatchingError';
import { ConstraintViolationError } from './errors/resultCodeErrors/ConstraintViolationError';
import { TypeOrValueExistsError } from './errors/resultCodeErrors/TypeOrValueExistsError';
import { InvalidSyntaxError } from './errors/resultCodeErrors/InvalidSyntaxError';
import { NoSuchObjectError } from './errors/resultCodeErrors/NoSuchObjectError';
import { AliasProblemError } from './errors/resultCodeErrors/AliasProblemError';
import { InvalidDNSyntaxError } from './errors/resultCodeErrors/InvalidDNSyntaxError';
import { IsLeafError } from './errors/resultCodeErrors/IsLeafError';
import { AliasDerefProblemError } from './errors/resultCodeErrors/AliasDerefProblemError';
import { InappropriateAuthError } from './errors/resultCodeErrors/InappropriateAuthError';
import { InsufficientAccessError } from './errors/resultCodeErrors/InsufficientAccessError';
import { InvalidCredentialsError } from './errors/resultCodeErrors/InvalidCredentialsError';
import { BusyError } from './errors/resultCodeErrors/BusyError';
import { UnavailableError } from './errors/resultCodeErrors/UnavailableError';
import { UnwillingToPerformError } from './errors/resultCodeErrors/UnwillingToPerformError';
import { LoopDetectError } from './errors/resultCodeErrors/LoopDetectError';
import { NamingViolationError } from './errors/resultCodeErrors/NamingViolationError';
import { ObjectClassViolationError } from './errors/resultCodeErrors/ObjectClassViolationError';
import { NotAllowedOnNonLeafError } from './errors/resultCodeErrors/NotAllowedOnNonLeafError';
import { NotAllowedOnRDNError } from './errors/resultCodeErrors/NotAllowedOnRDNError';
import { AlreadyExistsError } from './errors/resultCodeErrors/AlreadyExistsError';
import { NoObjectClassModsError } from './errors/resultCodeErrors/NoObjectClassModsError';
import { ResultsTooLargeError } from './errors/resultCodeErrors/ResultsTooLargeError';
import { AffectsMultipleDSAsError } from './errors/resultCodeErrors/AffectsMultipleDSAsError';
import { TLSNotSupportedError } from './errors/resultCodeErrors/TLSNotSupportedError';

export class StatusCodeParser {
  public static parse(code: number): ResultCodeError {
    switch (code) {
      case 1:
        return new OperationsError();
      case 2:
        return new ProtocolError();
      case 3:
        return new TimeLimitExceededError();
      case 4:
        return new SizeLimitExceededError();
      case 7:
        return new AuthMethodNotSupportedError();
      case 8:
        return new StrongAuthRequiredError();
      case 11:
        return new AdminLimitExceededError();
      case 12:
        return new UnavailableCriticalExtensionError();
      case 13:
        return new ConfidentialityRequiredError();
      case 16:
        return new NoSuchAttributeError();
      case 17:
        return new UndefinedTypeError();
      case 18:
        return new InappropriateMatchingError();
      case 19:
        return new ConstraintViolationError();
      case 20:
        return new TypeOrValueExistsError();
      case 21:
        return new InvalidSyntaxError();
      case 32:
        return new NoSuchObjectError();
      case 33:
        return new AliasProblemError();
      case 34:
        return new InvalidDNSyntaxError();
      case 35:
        return new IsLeafError();
      case 36:
        return new AliasDerefProblemError();
      case 48:
        return new InappropriateAuthError();
      case 49:
        return new InvalidCredentialsError();
      case 50:
        return new InsufficientAccessError();
      case 51:
        return new BusyError();
      case 52:
        return new UnavailableError();
      case 53:
        return new UnwillingToPerformError();
      case 54:
        return new LoopDetectError();
      case 64:
        return new NamingViolationError();
      case 65:
        return new ObjectClassViolationError();
      case 66:
        return new NotAllowedOnNonLeafError();
      case 67:
        return new NotAllowedOnRDNError();
      case 68:
        return new AlreadyExistsError();
      case 69:
        return new NoObjectClassModsError();
      case 70:
        return new ResultsTooLargeError();
      case 71:
        return new AffectsMultipleDSAsError();
      case 112:
        return new TLSNotSupportedError();
      default:
        return new UnknownStatusCodeError(code);
    }
  }
}

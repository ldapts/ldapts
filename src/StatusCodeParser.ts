import type { ResultCodeError } from './errors/resultCodeErrors';
import {
  OperationsError,
  UnknownStatusCodeError,
  ProtocolError,
  TimeLimitExceededError,
  SizeLimitExceededError,
  AuthMethodNotSupportedError,
  StrongAuthRequiredError,
  AdminLimitExceededError,
  UnavailableCriticalExtensionError,
  ConfidentialityRequiredError,
  NoSuchAttributeError,
  UndefinedTypeError,
  InappropriateMatchingError,
  ConstraintViolationError,
  TypeOrValueExistsError,
  InvalidSyntaxError,
  NoSuchObjectError,
  AliasProblemError,
  InvalidDNSyntaxError,
  IsLeafError,
  AliasDerefProblemError,
  InappropriateAuthError,
  InsufficientAccessError,
  InvalidCredentialsError,
  BusyError,
  UnavailableError,
  UnwillingToPerformError,
  LoopDetectError,
  NamingViolationError,
  ObjectClassViolationError,
  NotAllowedOnNonLeafError,
  NotAllowedOnRDNError,
  AlreadyExistsError,
  NoObjectClassModsError,
  ResultsTooLargeError,
  AffectsMultipleDSAsError,
  TLSNotSupportedError,
  SaslBindInProgressError,
} from './errors/resultCodeErrors';
import type { BindResponse } from './messages';
import type { MessageResponse } from './messages/MessageResponse';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StatusCodeParser {
  public static parse(result: MessageResponse): ResultCodeError {
    switch (result.status) {
      case 1:
        return new OperationsError(result.errorMessage);
      case 2:
        return new ProtocolError(result.errorMessage);
      case 3:
        return new TimeLimitExceededError(result.errorMessage);
      case 4:
        return new SizeLimitExceededError(result.errorMessage);
      case 7:
        return new AuthMethodNotSupportedError(result.errorMessage);
      case 8:
        return new StrongAuthRequiredError(result.errorMessage);
      case 11:
        return new AdminLimitExceededError(result.errorMessage);
      case 12:
        return new UnavailableCriticalExtensionError(result.errorMessage);
      case 13:
        return new ConfidentialityRequiredError(result.errorMessage);
      case 14:
        return new SaslBindInProgressError(result as BindResponse);
      case 16:
        return new NoSuchAttributeError(result.errorMessage);
      case 17:
        return new UndefinedTypeError(result.errorMessage);
      case 18:
        return new InappropriateMatchingError(result.errorMessage);
      case 19:
        return new ConstraintViolationError(result.errorMessage);
      case 20:
        return new TypeOrValueExistsError(result.errorMessage);
      case 21:
        return new InvalidSyntaxError(result.errorMessage);
      case 32:
        return new NoSuchObjectError(result.errorMessage);
      case 33:
        return new AliasProblemError(result.errorMessage);
      case 34:
        return new InvalidDNSyntaxError(result.errorMessage);
      case 35:
        return new IsLeafError(result.errorMessage);
      case 36:
        return new AliasDerefProblemError(result.errorMessage);
      case 48:
        return new InappropriateAuthError(result.errorMessage);
      case 49:
        return new InvalidCredentialsError(result.errorMessage);
      case 50:
        return new InsufficientAccessError(result.errorMessage);
      case 51:
        return new BusyError(result.errorMessage);
      case 52:
        return new UnavailableError(result.errorMessage);
      case 53:
        return new UnwillingToPerformError(result.errorMessage);
      case 54:
        return new LoopDetectError(result.errorMessage);
      case 64:
        return new NamingViolationError(result.errorMessage);
      case 65:
        return new ObjectClassViolationError(result.errorMessage);
      case 66:
        return new NotAllowedOnNonLeafError(result.errorMessage);
      case 67:
        return new NotAllowedOnRDNError(result.errorMessage);
      case 68:
        return new AlreadyExistsError(result.errorMessage);
      case 69:
        return new NoObjectClassModsError(result.errorMessage);
      case 70:
        return new ResultsTooLargeError(result.errorMessage);
      case 71:
        return new AffectsMultipleDSAsError(result.errorMessage);
      case 112:
        return new TLSNotSupportedError(result.errorMessage);
      default:
        return new UnknownStatusCodeError(result.status, result.errorMessage);
    }
  }
}

import {
  ResultCodeError,
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
} from './errors/resultCodeErrors';

export class StatusCodeParser {
  public static parse(code: number, message?: string): ResultCodeError {
    switch (code) {
      case 1:
        return new OperationsError(message);
      case 2:
        return new ProtocolError(message);
      case 3:
        return new TimeLimitExceededError(message);
      case 4:
        return new SizeLimitExceededError(message);
      case 7:
        return new AuthMethodNotSupportedError(message);
      case 8:
        return new StrongAuthRequiredError(message);
      case 11:
        return new AdminLimitExceededError(message);
      case 12:
        return new UnavailableCriticalExtensionError(message);
      case 13:
        return new ConfidentialityRequiredError(message);
      case 16:
        return new NoSuchAttributeError(message);
      case 17:
        return new UndefinedTypeError(message);
      case 18:
        return new InappropriateMatchingError(message);
      case 19:
        return new ConstraintViolationError(message);
      case 20:
        return new TypeOrValueExistsError(message);
      case 21:
        return new InvalidSyntaxError(message);
      case 32:
        return new NoSuchObjectError(message);
      case 33:
        return new AliasProblemError(message);
      case 34:
        return new InvalidDNSyntaxError(message);
      case 35:
        return new IsLeafError(message);
      case 36:
        return new AliasDerefProblemError(message);
      case 48:
        return new InappropriateAuthError(message);
      case 49:
        return new InvalidCredentialsError(message);
      case 50:
        return new InsufficientAccessError(message);
      case 51:
        return new BusyError(message);
      case 52:
        return new UnavailableError(message);
      case 53:
        return new UnwillingToPerformError(message);
      case 54:
        return new LoopDetectError(message);
      case 64:
        return new NamingViolationError(message);
      case 65:
        return new ObjectClassViolationError(message);
      case 66:
        return new NotAllowedOnNonLeafError(message);
      case 67:
        return new NotAllowedOnRDNError(message);
      case 68:
        return new AlreadyExistsError(message);
      case 69:
        return new NoObjectClassModsError(message);
      case 70:
        return new ResultsTooLargeError(message);
      case 71:
        return new AffectsMultipleDSAsError(message);
      case 112:
        return new TLSNotSupportedError(message);
      default:
        return new UnknownStatusCodeError(code, message);
    }
  }
}

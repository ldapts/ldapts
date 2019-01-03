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

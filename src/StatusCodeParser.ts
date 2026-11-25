import { type ResultCodeError } from './errors/index.js';
import {
  AdminLimitExceededError,
  AffectsMultipleDSAsError,
  AliasDerefProblemError,
  AliasProblemError,
  AlreadyExistsError,
  AuthMethodNotSupportedError,
  BusyError,
  ConfidentialityRequiredError,
  ConstraintViolationError,
  InappropriateAuthError,
  InappropriateMatchingError,
  InsufficientAccessError,
  InvalidCredentialsError,
  InvalidDNSyntaxError,
  InvalidSyntaxError,
  IsLeafError,
  LoopDetectError,
  MoreResultsToReturnError,
  NamingViolationError,
  NoObjectClassModsError,
  NoResultError,
  NoSuchAttributeError,
  NoSuchObjectError,
  NotAllowedOnNonLeafError,
  NotAllowedOnRDNError,
  ObjectClassViolationError,
  OperationsError,
  ProtocolError,
  ResultsTooLargeError,
  SaslBindInProgressError,
  SizeLimitExceededError,
  StrongAuthRequiredError,
  TimeLimitExceededError,
  TLSNotSupportedError,
  TypeOrValueExistsError,
  UnavailableCriticalExtensionError,
  UnavailableError,
  UndefinedTypeError,
  UnknownStatusCodeError,
  UnwillingToPerformError,
} from './errors/index.js';
import { type BindResponse } from './messages/BindResponse.js';
import { type MessageResponse } from './messages/MessageResponse.js';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StatusCodeParser {
  public static parse(result?: MessageResponse): ResultCodeError {
    if (!result) {
      return new NoResultError();
    }

    // MessageResponse defaults the server diagnostic to an empty string, while
    // the error constructors use `message ?? default`. Pass undefined when the
    // server sent nothing, so the description of the result code is kept.
    const diagnostic = result.errorMessage || undefined;

    switch (result.status) {
      case 1:
        return new OperationsError(diagnostic);
      case 2:
        return new ProtocolError(diagnostic);
      case 3:
        return new TimeLimitExceededError(diagnostic);
      case 4:
        return new SizeLimitExceededError(diagnostic);
      case 7:
        return new AuthMethodNotSupportedError(diagnostic);
      case 8:
        return new StrongAuthRequiredError(diagnostic);
      case 11:
        return new AdminLimitExceededError(diagnostic);
      case 12:
        return new UnavailableCriticalExtensionError(diagnostic);
      case 13:
        return new ConfidentialityRequiredError(diagnostic);
      case 14:
        return new SaslBindInProgressError(result as BindResponse);
      case 16:
        return new NoSuchAttributeError(diagnostic);
      case 17:
        return new UndefinedTypeError(diagnostic);
      case 18:
        return new InappropriateMatchingError(diagnostic);
      case 19:
        return new ConstraintViolationError(diagnostic);
      case 20:
        return new TypeOrValueExistsError(diagnostic);
      case 21:
        return new InvalidSyntaxError(diagnostic);
      case 32:
        return new NoSuchObjectError(diagnostic);
      case 33:
        return new AliasProblemError(diagnostic);
      case 34:
        return new InvalidDNSyntaxError(diagnostic);
      case 35:
        return new IsLeafError(diagnostic);
      case 36:
        return new AliasDerefProblemError(diagnostic);
      case 48:
        return new InappropriateAuthError(diagnostic);
      case 49:
        return new InvalidCredentialsError(diagnostic);
      case 50:
        return new InsufficientAccessError(diagnostic);
      case 51:
        return new BusyError(diagnostic);
      case 52:
        return new UnavailableError(diagnostic);
      case 53:
        return new UnwillingToPerformError(diagnostic);
      case 54:
        return new LoopDetectError(diagnostic);
      case 64:
        return new NamingViolationError(diagnostic);
      case 65:
        return new ObjectClassViolationError(diagnostic);
      case 66:
        return new NotAllowedOnNonLeafError(diagnostic);
      case 67:
        return new NotAllowedOnRDNError(diagnostic);
      case 68:
        return new AlreadyExistsError(diagnostic);
      case 69:
        return new NoObjectClassModsError(diagnostic);
      case 70:
        return new ResultsTooLargeError(diagnostic);
      case 71:
        return new AffectsMultipleDSAsError(diagnostic);
      case 95:
        return new MoreResultsToReturnError(diagnostic);
      case 112:
        return new TLSNotSupportedError(diagnostic);
      case 248:
        return new NoResultError(diagnostic);
      default:
        return new UnknownStatusCodeError(result.status, diagnostic);
    }
  }
}

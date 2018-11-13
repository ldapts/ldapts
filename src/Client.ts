import debug from 'debug';
import { parse as parseUrl } from 'url';
import * as tls from 'tls';
import Timer = NodeJS.Timer;
import { Control } from './controls/Control';
import { Message } from './messages/Message';
import { BindRequest } from './messages/BindRequest';
import { UnbindRequest } from './messages/UnbindRequest';
import { AbandonRequest } from './messages/AbandonRequest';
import { CompareRequest } from './messages/CompareRequest';
import { DeleteRequest } from './messages/DeleteRequest';
import { ExtendedRequest } from './messages/ExtendedRequest';
import { ModifyDNRequest } from './messages/ModifyDNRequest';
import { SearchRequest } from './messages/SearchRequest';
import { Filter } from './filters/Filter';
import { PagedResultsControl } from './controls/PagedResultsControl';
import { MessageParser } from './MessageParser';
import { BindResponse } from './messages/BindResponse';
import { MessageResponse } from './messages/MessageResponse';
import { MessageResponseStatus } from './MessageResponseStatus';
import { InvalidCredentialsError } from './errors/InvalidCredentialsError';
import { CompareResponse, CompareResult } from './messages/CompareResponse';
import { CompareError } from './errors/CompareError';
import { MessageParserError } from './errors/MessageParserError';
import { SearchResponse } from './messages/SearchResponse';
import { SearchReference } from './messages/SearchReference';
import { SearchEntry } from './messages/SearchEntry';

const MAX_MESSAGE_ID = Math.pow(2, 31) - 1;
const logDebug = debug('ldapts');

export interface ClientOptions {
  /**
   * A valid LDAP URL (proto/host/port only)
   */
  url: string;
  /**
   * Milliseconds client should let operations live for before timing out (Default: no timeout)
   */
  timeout?: number;
  /**
   * Milliseconds client should wait before timing out on TCP connections
   */
  connectTimeout?: number;
  /**
   * Additional options passed to TLS connection layer when connecting via ldaps://
   */
  tlsOptions?: tls.TlsOptions;
  /**
   * Force strict DN parsing for client methods (Default: true)
   */
  strictDN?: boolean;
}

interface MessageDetails {
  message: Message;
  searchEntries?: SearchEntry[];
  searchReferences?: SearchReference[];
  resolve: (message?: MessageResponse) => void;
  reject: (err: Error) => void;
  timeoutTimer: Timer | null;
}

export interface SearchPageOptions {
  pageSize?: number;
}

export interface SearchOptions {
  scope?: 'base' | 'one' | 'sub' | 'children';
  derefAliases?: 'never' | 'always' | 'search' | 'find';
  returnAttributeValues?: boolean;
  sizeLimit?: number;
  timeLimit?: number;
  paged?: SearchPageOptions | boolean;
  filter?: string | Filter;
  attributes?: string[];
}

export interface SearchResult {
  // tslint:disable-next-line: array-type
  searchEntries: { dn: string, [index: string]: string | string[] }[];
  searchReferences: string[];
}

export class Client {
  private clientOptions: ClientOptions;
  private messageId: number = 1;
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private connected: boolean = false;
  private socket!: tls.TLSSocket;
  private connectTimer!: Timer;
  private readonly messageParser = new MessageParser();
  private readonly messageDetailsByMessageId: { [index: string]: MessageDetails } = {};

  constructor(options: ClientOptions) {
    this.clientOptions = options || {};
    if (!this.clientOptions.timeout) {
      this.clientOptions.timeout = 0;
    }

    if (!this.clientOptions.connectTimeout) {
      this.clientOptions.connectTimeout = 0;
    }

    this.clientOptions.strictDN = this.clientOptions.strictDN !== false;

    const parsedUrl = parseUrl(options.url);
    if (!parsedUrl.protocol || !(parsedUrl.protocol === 'ldap:' || parsedUrl.protocol === 'ldaps:')) {
      throw new Error(`${options.url} is an invalid LDAP URL (protocol)`);
    }

    this.secure = parsedUrl.protocol === 'ldaps:';
    this.host = parsedUrl.hostname || 'localhost';
    if (parsedUrl.port) {
      this.port = Number(parsedUrl.port);
    } else if (this.secure) {
      this.port = 636;
    } else {
      this.port = 389;
    }

    this.messageParser.on('error', (err: MessageParserError) => {
      if (err.messageDetails && err.messageDetails.messageId) {
        const messageDetails = this.messageDetailsByMessageId[err.messageDetails.messageId.toString()];
        if (messageDetails) {
          delete this.messageDetailsByMessageId[err.messageDetails.messageId.toString()];
          return messageDetails.reject(err);
        }
      }

      logDebug(err.stack);
    });

    this.messageParser.on('message', this._handleSendResponse.bind(this));
  }

  /**
   * Performs a simple authentication against the server.
   * @param {string} dn
   * @param {string} [password]
   * @param {Control|Control[]} [controls]
   */
  public async bind(dn: string, password?: string, controls?: Control|Control[]): Promise<void> {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    const req = new BindRequest({
      messageId: this._nextMessageId(),
      dn,
      password,
      controls,
    });

    const result = await this._send<BindResponse>(req);
    if (result.status !== MessageResponseStatus.Success) {
      throw new InvalidCredentialsError(`Bind DN or password is incorrect.`);
    }
  }

  /**
   * Compares an attribute/value pair with an entry on the LDAP server.
   * @param {string} dn - The DN of the entry to compare attributes with
   * @param {string} attribute
   * @param {string} value
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async compare(dn: string, attribute: string, value: string, controls?: Control|Control[]): Promise<boolean> {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    const req = new CompareRequest({
      messageId: this._nextMessageId(),
      dn,
      attribute,
      value,
      controls,
    });

    const response = await this._send<CompareResponse>(req);
    switch (response.status) {
      case CompareResult.compareTrue:
        return true;
      case CompareResult.compareFalse:
        return false;
      case CompareResult.noSuchAttribute:
        throw new CompareError('Attribute does not exist');
      case CompareResult.noSuchObject:
        throw new CompareError('Target entry does not exist');
      default:
        throw new CompareError(`Unknown error: 0x${response.status.toString(16)}`);
    }
  }

  /**
   * Deletes an entry from the LDAP server.
   * @param {string} dn - The DN of the entry to delete
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async del(dn: string, controls?: Control|Control[]) {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    const req = new DeleteRequest({
      messageId: this._nextMessageId(),
      dn,
      controls,
    });

    return this._send(req);
  }

  /**
   * Performs an extended operation on the LDAP server.
   * @param {string} oid - The object identifier (OID) of the extended operation to perform
   * @param {string} [value]
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async exop(oid: string, value?: string, controls?: Control|Control[]) {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    const req = new ExtendedRequest({
      messageId: this._nextMessageId(),
      oid,
      value,
      controls,
    });

    return this._send(req);
  }

  /**
   * Performs an LDAP modifyDN against the server.
   *
   * This does not allow you to keep the old DN, as while the LDAP protocol
   * has a facility for that, it's stupid. Just Search/Add.
   *
   * This will automatically deal with "new superior" logic.
   *
   * @param {string} dn - The DN of the entry to modify
   * @param {string} newDN - The new DN to move this entry to
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async modifyDN(dn: string, newDN: string, controls?: Control|Control[]) {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    // TODO: parse newDN to determine if newSuperior should be specified
    const req = new ModifyDNRequest({
      messageId: this._nextMessageId(),
      dn,
      deleteOldRdn: true,
      newRdn: newDN,
      controls,
    });

    return this._send(req);
  }

  /**
   * Performs an LDAP search against the server.
   *
   * @param {string} baseDN - The DN in the tree to start searching at
   * @param {SearchOptions} options
   * @param {Control|Control[]} [controls]
   */
  public async search(baseDN: string, options: SearchOptions = {}, controls?: Control|Control[]): Promise<SearchResult> {
    if (!this.connected) {
      await this._connect();
    }

    if (controls) {
      if (Array.isArray(controls)) {
        // tslint:disable-next-line:no-parameter-reassignment
        controls = controls.slice(0);
      } else {
        // tslint:disable-next-line:no-parameter-reassignment
        controls = [controls];
      }

      // Make sure PagedResultsControl is not specified since it's handled internally
      for (const control of controls) {
        if (control instanceof PagedResultsControl) {
          throw new Error('Should not specify PagedResultsControl');
        }
      }
    } else {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [];
    }

    let pageSize: number = 100;
    if (typeof options.paged === 'object' && options.paged.pageSize) {
      pageSize = options.paged.pageSize;
    }

    const pagedResultsControl = new PagedResultsControl({
      value: {
        size: pageSize,
      },
    });
    controls.push(pagedResultsControl);

    const searchRequest = new SearchRequest({
      messageId: -1, // NOTE: This will be set from _sendRequest()
      baseDN,
      scope: options.scope,
      filter: options.filter,
      attributes: options.attributes,
      returnAttributeValues: options.returnAttributeValues,
      sizeLimit: options.sizeLimit,
      timeLimit: options.timeLimit,
      controls,
    });

    const searchResult: SearchResult = {
      searchEntries: [],
      searchReferences: [],
    };

    await this._sendSearch(searchRequest, searchResult, (typeof options.paged !== 'undefined'), pageSize, pagedResultsControl);

    return searchResult;
  }

  /**
   * Unbinds this client from the LDAP server.
   * @returns {void|Promise} void if not connected; otherwise returns a promise to the request to disconnect
   */
  public async unbind(controls?: Control|Control[]): Promise<void> {
    if (!this.connected) {
      return;
    }

    const req = new UnbindRequest({
      messageId: this._nextMessageId(),
    });

    await this._send(req);
  }

  private async _sendSearch(searchRequest: SearchRequest, searchResult: SearchResult, paged: boolean, pageSize: number, pagedResultsControl: PagedResultsControl) {
    searchRequest.messageId = this._nextMessageId();

    const result = await this._send<SearchResponse>(searchRequest);

    for (const searchEntry of result.searchEntries) {
      searchResult.searchEntries.push(searchEntry.toObject());
    }

    for (const searchReference of result.searchReferences) {
      searchResult.searchReferences.push(...searchReference.uris);
    }

    // Recursively search if paging is specified
    if (paged) {
      let pagedResultsFromResponse: PagedResultsControl | null = null;
      for (const control of (result.controls || [])) {
        if (control instanceof PagedResultsControl) {
          pagedResultsFromResponse = control;
          break;
        }
      }

      if (pagedResultsFromResponse && pagedResultsFromResponse.value && pagedResultsFromResponse.value.cookie) {
        // Recursively keep searching
        pagedResultsControl.value = pagedResultsControl.value || {
          size: pageSize,
        };
        pagedResultsControl.value.cookie = pagedResultsFromResponse.value.cookie;
        await this._sendSearch(searchRequest, searchResult, paged, pageSize, pagedResultsControl);
      }
    }
  }

  private _nextMessageId() {
    this.messageId += 1;
    if (this.messageId >= MAX_MESSAGE_ID) {
      this.messageId = 1;
    }

    return this.messageId;
  }

  /**
   * Open the socket connection
   * @returns {Promise<void>}
   * @private
   */
  private _connect() {
    if (this.connected) {
      return true;
    }

    return new Promise((resolve, reject) => {
      this.socket = tls.connect(this.port, this.host, this.clientOptions.tlsOptions);
      if (this.secure) {
        this.socket.once('secureConnect', () => {
          this._onConnect(resolve);
        });
      } else {
        this.socket.once('connect', () => {
          this._onConnect(resolve);
        });
      }
      this.socket.once('error', (err: Error) => {
        if (this.connectTimer) {
          clearTimeout(this.connectTimer);
          delete this.connectTimer;
        }

        reject(err);
      });

      if (this.clientOptions.connectTimeout) {
        this.connectTimer = setTimeout(() => {
          if (this.socket && (!this.socket.readable || !this.socket.writable)) {
            this.socket.destroy();
            delete this.socket;
          }

          return reject(new Error('Connection timeout'));
        },                             this.clientOptions.connectTimeout);
      }
    });
  }

  private _onConnect(next: () => void) {
    clearTimeout(this.connectTimer);

    // Clear out event listeners from _connect()
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('connect');
    this.socket.removeAllListeners('secureConnect');

    this.connected = true;

    this.socket.on('error', () => {
      this.socket.destroy();
    });
    this.socket.on('close', () => {
      this.socket.removeAllListeners('connect');
      this.socket.removeAllListeners('data');
      this.socket.removeAllListeners('drain');
      this.socket.removeAllListeners('error');
      this.socket.removeAllListeners('end');
      this.socket.removeAllListeners('timeout');
      this.socket.removeAllListeners('close');

      delete this.socket;

      // Clean up any pending messages
      for (const messageDetails of Object.values(this.messageDetailsByMessageId)) {
        if (messageDetails.message instanceof UnbindRequest) {
          // Consider unbind as success since the connection is closed.
          messageDetails.resolve();
        } else {
          messageDetails.reject(new Error('Connection closed.'));
        }
      }
    });
    this.socket.on('data', (data: Buffer) => {
      this.messageParser.read(data);
    });
    this.socket.on('end', () => {
      // Acknowledge to other end of the connection that the connection is ended.
      this.socket.end();
    });
    this.socket.on('timeout', () => {
      this.socket.end();
    });

    return next();
  }

  /**
   * Sends request message to the ldap server over the connected socket.
   * Each message request is given a unique id (messageId), used to identify the associated response when it is sent back over the socket.
   * @returns {Promise<Message>}
   * @private
   */
  private _send<TMessageResponse extends MessageResponse>(message: Message): Promise<TMessageResponse> {
    if (!this.connected || !this.socket) {
      throw new Error('Socket connection not established');
    }

    /* tslint:disable:no-empty */
    let messageResolve: (message?: MessageResponse) => void = () => {};
    let messageReject: (err: Error) => void = () => {};
    /* tslint:enable:no-empty */
    const sendPromise = new Promise<TMessageResponse>((resolve, reject) => {
      // @ts-ignore
      messageResolve = resolve;
      messageReject = reject;
    });

    this.messageDetailsByMessageId[message.messageId.toString()] = {
      message,
      resolve: messageResolve,
      reject: messageReject,
      timeoutTimer: this.clientOptions.timeout ? setTimeout(() => {
        return messageReject(new Error(`${message.constructor.name}: Operation timed out`));
      },                                                    this.clientOptions.timeout) : null,
    };

    // Send the message to the socket
    logDebug(`Sending message: ${message}`);
    this.socket.write(message.write(), () => {
      if (message instanceof AbandonRequest) {
        logDebug(`Abandoned message: ${message.messageId}`);
        delete this.messageDetailsByMessageId[message.messageId.toString()];
        messageResolve();
      } else if (message instanceof UnbindRequest) {
        logDebug(`Unbind success. Ending socket`);
        this.connected = false;
        if (this.socket) {
          // Ignore any error since the connection is being closed
          this.socket.removeAllListeners('error');
          // tslint:disable-next-line:no-empty
          this.socket.on('error', () => {});
          this.socket.end();
        }
      } else {
        // NOTE: messageResolve will be called as 'data' events come from the socket
        logDebug('Message sent successfully.');
      }
    });

    return sendPromise;
  }

  private _handleSendResponse(message: Message) {
    const messageDetails = this.messageDetailsByMessageId[message.messageId.toString()];
    if (messageDetails) {
      // When performing a search, an arbitrary number of SearchEntry and SearchReference messages come through with the
      // same messageId as the SearchRequest. Finally, a SearchResponse will come through to complete the request.
      if (message instanceof SearchEntry) {
        messageDetails.searchEntries = messageDetails.searchEntries || [];
        messageDetails.searchEntries.push(message);
      } else if (message instanceof SearchReference) {
        messageDetails.searchReferences = messageDetails.searchReferences || [];
        messageDetails.searchReferences.push(message);
      } else if (message instanceof SearchResponse) {
        // Assign any previously collected entries & references
        if (messageDetails.searchEntries) {
          message.searchEntries.push(...messageDetails.searchEntries);
        }

        if (messageDetails.searchReferences) {
          message.searchReferences.push(...messageDetails.searchReferences);
        }

        delete this.messageDetailsByMessageId[message.messageId.toString()];
        messageDetails.resolve(message as MessageResponse);
      } else {
        delete this.messageDetailsByMessageId[message.messageId.toString()];
        messageDetails.resolve(message as MessageResponse);
      }
    } else {
      logDebug(`Unable to find details related to message response: ${message}`);
    }
  }
}

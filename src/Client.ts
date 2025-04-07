import * as net from 'node:net';
import * as tls from 'node:tls';

import debug from 'debug';
import { v4 } from 'uuid';
import { parseURL } from 'whatwg-url';

import { Attribute } from './Attribute.js';
import type { Change } from './Change.js';
import type { Control } from './controls/Control.js';
import { PagedResultsControl } from './controls/PagedResultsControl.js';
import type { DN } from './dn/DN.js';
import type { MessageParserError } from './errors/MessageParserError.js';
import { FilterParser } from './FilterParser.js';
import type { Filter } from './filters/Filter.js';
import { PresenceFilter } from './filters/PresenceFilter.js';
import { MessageParser } from './MessageParser.js';
import { MessageResponseStatus } from './MessageResponseStatus.js';
import {
  AbandonRequest,
  AddRequest,
  BindRequest,
  CompareRequest,
  CompareResult,
  DeleteRequest,
  ExtendedRequest,
  ModifyDNRequest,
  ModifyRequest,
  SASL_MECHANISMS,
  SearchEntry,
  SearchReference,
  SearchRequest,
  SearchResponse,
  UnbindRequest,
} from './messages/index.js';
import type { AddResponse, BindResponse, CompareResponse, DeleteResponse, Entry, ExtendedResponse, ModifyDNResponse, ModifyResponse, SaslMechanism } from './messages/index.js';
import type { Message } from './messages/Message.js';
import type { MessageResponse } from './messages/MessageResponse.js';
import { StatusCodeParser } from './StatusCodeParser.js';

const MAX_MESSAGE_ID = 2 ** 31 - 1;
const logDebug = debug('ldapts');

type SocketWithId = { id?: string } & (net.Socket | tls.TLSSocket);

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
  tlsOptions?: tls.ConnectionOptions;
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
  timeoutTimer: NodeJS.Timer | null;
  socket: SocketWithId;
}

export interface SearchPageOptions {
  /**
   * Number of SearchEntries to return per page for a search request. If the page size is greater than or equal to the
   * sizeLimit value, the server should ignore the control as the request can be satisfied in a single page.
   */
  pageSize?: number;
}

export interface SearchOptions {
  /**
   * Specifies how broad the search context is:
   * - base - Indicates that only the entry specified as the search base should be considered. None of its subordinates will be considered.
   * - one - Indicates that only the immediate children of the entry specified as the search base should be considered. The base entry itself should not be considered, nor any descendants of the immediate children of the base entry.
   * - sub - Indicates that the entry specified as the search base, and all of its subordinates to any depth, should be considered.
   * - children or subordinates - Indicates that the entry specified by the search base should not be considered, but all of its subordinates to any depth should be considered.
   */
  scope?: 'base' | 'children' | 'one' | 'sub' | 'subordinates';
  /**
   * Specifies how the server must treat references to other entries:
   * - never - Never dereferences entries, returns alias objects instead. The alias contains the reference to the real entry.
   * - always - Always returns the referenced entries, not the alias object.
   * - search - While searching subordinates of the base object, dereferences any alias within the search scope. Dereferenced objects become the bases of further search scopes where the Search operation is also applied by the server. The server should eliminate duplicate entries that arise due to alias dereferencing while searching.
   * - find - Dereferences aliases in locating the base object of the search, but not when searching subordinates of the base object.
   */
  derefAliases?: 'always' | 'find' | 'never' | 'search';
  /**
   * If true, attribute values should be included in the entries that are returned; otherwise entries that match the search criteria should be returned containing only the attribute descriptions for the attributes contained in that entry but should not include the values for those attributes.
   */
  returnAttributeValues?: boolean;
  /**
   * This specifies the maximum number of entries that should be returned from the search. A value of zero indicates no limit. Note that the server may also impose a size limit for the search operation, and in that case the smaller of the client-requested and server-imposed size limits will be enforced.
   */
  sizeLimit?: number;
  /**
   * This specifies the maximum length of time, in seconds, that the server should spend processing the search. A value of zero indicates no limit. Note that the server may also impose a time limit for the search operation, and in that case the smaller of the client-requested and server-imposed time limits will be enforced.
   */
  timeLimit?: number;
  /**
   * Used to allow paging and specify the page size
   */
  paged?: SearchPageOptions | boolean;
  /**
   * The filter of the search request. It must conform to the LDAP filter syntax specified in RFC4515
   */
  filter?: Filter | string;
  /**
   * A set of attributes to request for inclusion in entries that match the search criteria and are returned to the client. If a specific set of attribute descriptions are listed, then only those attributes should be included in matching entries. The special value “*” indicates that all user attributes should be included in matching entries. The special value “+” indicates that all operational attributes should be included in matching entries. The special value “1.1” indicates that no attributes should be included in matching entries. Some servers may also support the ability to use the “@” symbol followed by an object class name (e.g., “@inetOrgPerson”) to request all attributes associated with that object class. If the set of attributes to request is empty, then the server should behave as if the value “*” was specified to request that all user attributes be included in entries that are returned.
   */
  attributes?: string[];
  /**
   * List of attributes to explicitly return as buffers
   */
  explicitBufferAttributes?: string[];
}

export interface SearchResult {
  searchEntries: Entry[];
  searchReferences: string[];
}

// @ts-expect-error - Polyfill Symbol.asyncDispose
Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');

declare global {
  interface SymbolConstructor {
    readonly asyncDispose: unique symbol;
  }
}

export class Client {
  private clientOptions: ClientOptions;

  private messageId = 1;

  private readonly host: string;

  private readonly port: number;

  private readonly secure: boolean;

  private connected = false;

  private socket?: SocketWithId;

  private connectTimer?: NodeJS.Timeout;

  private readonly messageParser = new MessageParser();

  private readonly messageDetailsByMessageId = new Map<string, MessageDetails>();

  public constructor(options: ClientOptions) {
    this.clientOptions = options;
    this.clientOptions.timeout ??= 0;
    this.clientOptions.connectTimeout ??= 0;

    this.clientOptions.strictDN = this.clientOptions.strictDN !== false;

    const parsedUrl = parseURL(options.url);
    if (!parsedUrl?.scheme || !(parsedUrl.scheme === 'ldap' || parsedUrl.scheme === 'ldaps')) {
      throw new Error(`${options.url} is an invalid LDAP URL (protocol)`);
    }

    const isSecureProtocol = parsedUrl.scheme === 'ldaps';
    this.secure = isSecureProtocol || !!this.clientOptions.tlsOptions;
    let host: string | null | undefined = null;
    if (typeof parsedUrl.host === 'string') {
      // Host might include a port, so split to get the hostname part
      host = parsedUrl.host.split(':')[0];
    } else if (Array.isArray(parsedUrl.host)) {
      // Handle IPv6Address case by joining parts
      host = parsedUrl.host.join(':');
    } else if (parsedUrl.host !== null) {
      // If it's a number or any other type, convert to string
      host = String(parsedUrl.host);
    }

    this.host = host ?? 'localhost'; // Default to 'localhost' if host is null

    if (parsedUrl.port) {
      this.port = Number(parsedUrl.port);
    } else if (isSecureProtocol) {
      this.port = 636;
    } else {
      this.port = 389;
    }

    this.messageParser.on('error', (err: MessageParserError) => {
      if (err.messageDetails?.messageId) {
        const messageDetails = this.messageDetailsByMessageId.get(err.messageDetails.messageId.toString());
        if (messageDetails) {
          this.messageDetailsByMessageId.delete(err.messageDetails.messageId.toString());
          messageDetails.reject(err);
          return;
        }
      }

      logDebug(err.stack);
    });

    this.messageParser.on('message', this._handleSendResponse.bind(this));
  }

  public get isConnected(): boolean {
    return !!this.socket && this.connected;
  }

  public async startTLS(options: tls.ConnectionOptions = {}, controls?: Control | Control[]): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    await this.exop('1.3.6.1.4.1.1466.20037', undefined, controls);

    const originalSocket = this.socket;
    if (originalSocket) {
      originalSocket.removeListener('data', this.socketDataHandler);

      // Reuse existing socket
      options.socket = originalSocket;
    }

    this.socket = await new Promise((resolve: (value: SocketWithId) => void, reject: (reason: Error) => void) => {
      const secureSocket = tls.connect(options);
      secureSocket.once('secureConnect', () => {
        secureSocket.removeAllListeners('error');

        secureSocket.on('data', this.socketDataHandler);
        secureSocket.on('error', () => {
          if (originalSocket) {
            originalSocket.destroy();
          }
        });

        resolve(secureSocket);
      });
      secureSocket.once('error', (err: Error) => {
        secureSocket.removeAllListeners();
        reject(err);
      });
    });

    if (originalSocket) {
      // Allows pending messages and unbind responses to be handled and cleaned up
      this.socket.id = originalSocket.id;
    }
  }

  /**
   * Performs a simple or sasl authentication against the server.
   * @param {string|DN|SaslMechanism} dnOrSaslMechanism
   * @param {string} [password]
   * @param {Control|Control[]} [controls]
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  public async bind(dnOrSaslMechanism: DN | SaslMechanism | string, password?: string, controls?: Control | Control[]): Promise<void> {
    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    if (typeof dnOrSaslMechanism === 'string' && SASL_MECHANISMS.includes(dnOrSaslMechanism as SaslMechanism)) {
      await this.bindSASL(dnOrSaslMechanism, password, controls);
      return;
    }

    const req = new BindRequest({
      messageId: this._nextMessageId(),
      dn: typeof dnOrSaslMechanism === 'string' ? dnOrSaslMechanism : dnOrSaslMechanism.toString(),
      password,
      controls,
    });
    await this._sendBind(req);
  }

  /**
   * Performs a sasl authentication against the server.
   * @param {string|SaslMechanism} mechanism
   * @param {string} [password]
   * @param {Control|Control[]} [controls]
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  public async bindSASL(mechanism: SaslMechanism | string, password?: string, controls?: Control | Control[]): Promise<void> {
    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    const req = new BindRequest({
      messageId: this._nextMessageId(),
      mechanism,
      password,
      controls,
    });
    await this._sendBind(req);
  }

  /**
   * Used to create a new entry in the directory
   * @param {string|DN} dn - The DN of the entry to add
   * @param {Attribute[]|object} attributes - Array of attributes or object where keys are the name of each attribute
   * @param {Control|Control[]} [controls]
   */
  public async add(dn: DN | string, attributes: Attribute[] | Record<string, string[] | string>, controls?: Control | Control[]): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    let attributesToAdd;
    if (Array.isArray(attributes)) {
      attributesToAdd = attributes;
    } else {
      attributesToAdd = [];
      for (const [key, value] of Object.entries(attributes)) {
        let values;
        if (Array.isArray(value)) {
          values = value;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (value == null) {
          values = [] as string[];
        } else {
          values = [value];
        }

        attributesToAdd.push(
          new Attribute({
            type: key,
            values,
          }),
        );
      }
    }

    const req = new AddRequest({
      messageId: this._nextMessageId(),
      dn: typeof dn === 'string' ? dn : dn.toString(),
      attributes: attributesToAdd,
      controls,
    });

    const result = await this._send<AddResponse>(req);

    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }
  }

  /**
   * Compares an attribute/value pair with an entry on the LDAP server.
   * @param {string|DN} dn - The DN of the entry to compare attributes with
   * @param {string} attribute
   * @param {string} value
   * @param {Control|Control[]} [controls]
   * @returns true if attribute and value match; otherwise false
   */
  public async compare(dn: DN | string, attribute: string, value: string, controls?: Control | Control[]): Promise<boolean> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    const req = new CompareRequest({
      messageId: this._nextMessageId(),
      dn: typeof dn === 'string' ? dn : dn.toString(),
      attribute,
      value,
      controls,
    });

    const response = await this._send<CompareResponse>(req);

    switch (response?.status) {
      case CompareResult.compareTrue:
        return true;
      case CompareResult.compareFalse:
        return false;
      default:
        throw StatusCodeParser.parse(response);
    }
  }

  /**
   * Deletes an entry from the LDAP server.
   * @param {string|DN} dn - The DN of the entry to delete
   * @param {Control|Control[]} [controls]
   */
  public async del(dn: DN | string, controls?: Control | Control[]): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    const req = new DeleteRequest({
      messageId: this._nextMessageId(),
      dn: typeof dn === 'string' ? dn : dn.toString(),
      controls,
    });

    const result = await this._send<DeleteResponse>(req);
    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }
  }

  /**
   * Performs an extended operation on the LDAP server.
   * @param {string} oid - The object identifier (OID) of the extended operation to perform
   * @param {string|Buffer} [value]
   * @param {Control|Control[]} [controls]
   * @returns exop result
   */
  public async exop(oid: string, value?: Buffer | string, controls?: Control | Control[]): Promise<{ oid?: string; value?: string }> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    const req = new ExtendedRequest({
      messageId: this._nextMessageId(),
      oid,
      value,
      controls,
    });

    const result = await this._send<ExtendedResponse>(req);
    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }

    return {
      oid: result.oid,
      value: result.value,
    };
  }

  /**
   * Performs an LDAP modify against the server.
   * @param {string|DN} dn - The DN of the entry to modify
   * @param {Change|Change[]} changes
   * @param {Control|Control[]} [controls]
   */
  public async modify(dn: DN | string, changes: Change | Change[], controls?: Control | Control[]): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (!Array.isArray(changes)) {
      changes = [changes];
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    const req = new ModifyRequest({
      messageId: this._nextMessageId(),
      dn: typeof dn === 'string' ? dn : dn.toString(),
      changes,
      controls,
    });

    const result = await this._send<ModifyResponse>(req);
    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }
  }

  /**
   * Performs an LDAP modifyDN against the server.
   * @param {string|DN} dn - The DN of the entry to modify
   * @param {string|DN} newDN - The new DN to move this entry to
   * @param {Control|Control[]} [controls]
   */
  public async modifyDN(dn: DN | string, newDN: DN | string, controls?: Control | Control[]): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      controls = [controls];
    }

    let newSuperior: string | undefined;
    if (typeof newDN === 'string' && /[^\\],/.test(newDN)) {
      const parseIndex = newDN.search(/[^\\],/);
      newSuperior = newDN.slice(parseIndex + 2);
      newDN = newDN.slice(0, parseIndex + 1);
    }

    const req = new ModifyDNRequest({
      messageId: this._nextMessageId(),
      dn: typeof dn === 'string' ? dn : dn.toString(),
      deleteOldRdn: true,
      newRdn: typeof newDN === 'string' ? newDN : newDN.toString(),
      newSuperior,
      controls,
    });

    const result = await this._send<ModifyDNResponse>(req);
    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }
  }

  /**
   * Performs an LDAP search against the server.
   * @param {string|DN} baseDN - This specifies the base of the subtree in which the search is to be constrained.
   * @param {SearchOptions} [options]
   * @param {string|Filter} [options.filter] - The filter of the search request. It must conform to the LDAP filter syntax specified in RFC4515. Defaults to (objectclass=*)
   * @param {string} [options.scope] - Specifies how broad the search context is:
   * - base - Indicates that only the entry specified as the search base should be considered. None of its subordinates will be considered.
   * - one - Indicates that only the immediate children of the entry specified as the search base should be considered. The base entry itself should not be considered, nor any descendants of the immediate children of the base entry.
   * - sub - Indicates that the entry specified as the search base, and all of its subordinates to any depth, should be considered.
   * - children or subordinates - Indicates that the entry specified by the search base should not be considered, but all of its subordinates to any depth should be considered.
   * @param {string} [options.derefAliases] - Specifies how the server must treat references to other entries:
   * - never - Never dereferences entries, returns alias objects instead. The alias contains the reference to the real entry.
   * - always - Always returns the referenced entries, not the alias object.
   * - search - While searching subordinates of the base object, dereferences any alias within the search scope. Dereferenced objects become the bases of further search scopes where the Search operation is also applied by the server. The server should eliminate duplicate entries that arise due to alias dereferencing while searching.
   * - find - Dereferences aliases in locating the base object of the search, but not when searching subordinates of the base object.
   * @param {boolean} [options.returnAttributeValues] - If true, attribute values should be included in the entries that are returned; otherwise entries that match the search criteria should be returned containing only the attribute descriptions for the attributes contained in that entry but should not include the values for those attributes.
   * @param {number} [options.sizeLimit] - This specifies the maximum number of entries that should be returned from the search. A value of zero indicates no limit. Note that the server may also impose a size limit for the search operation, and in that case the smaller of the client-requested and server-imposed size limits will be enforced.
   * @param {number} [options.timeLimit] - This specifies the maximum length of time, in seconds, that the server should spend processing the search. A value of zero indicates no limit. Note that the server may also impose a time limit for the search operation, and in that case the smaller of the client-requested and server-imposed time limits will be enforced.
   * @param {boolean|SearchPageOptions} [options.paged] - Used to allow paging and specify the page size
   * @param {string[]} [options.attributes] - A set of attributes to request for inclusion in entries that match the search criteria and are returned to the client. If a specific set of attribute descriptions are listed, then only those attributes should be included in matching entries. The special value “*” indicates that all user attributes should be included in matching entries. The special value “+” indicates that all operational attributes should be included in matching entries. The special value “1.1” indicates that no attributes should be included in matching entries. Some servers may also support the ability to use the “@” symbol followed by an object class name (e.g., “@inetOrgPerson”) to request all attributes associated with that object class. If the set of attributes to request is empty, then the server should behave as if the value “*” was specified to request that all user attributes be included in entries that are returned.
   * @param {string[]} [options.explicitBufferAttributes] - List of attributes to explicitly return as buffers
   * @param {Control|Control[]} [controls]
   * @returns {Promise<SearchResult>}
   */
  public async search(baseDN: DN | string, options: SearchOptions = {}, controls?: Control | Control[]): Promise<SearchResult> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls) {
      if (Array.isArray(controls)) {
        controls = controls.slice(0);
      } else {
        controls = [controls];
      }

      // Make sure PagedResultsControl is not specified since it's handled internally
      for (const control of controls) {
        if (control instanceof PagedResultsControl) {
          throw new Error('Should not specify PagedResultsControl');
        }
      }
    } else {
      controls = [];
    }

    let pageSize = 100;
    if (typeof options.paged === 'object' && options.paged.pageSize) {
      pageSize = options.paged.pageSize;
    } else if (options.sizeLimit && options.sizeLimit > 1) {
      // According to the RFC, servers should ignore the paging control if
      // pageSize >= sizelimit.  Some might still send results, but it's safer
      // to stay under that figure when assigning a default value.
      pageSize = options.sizeLimit - 1;
    }

    let pagedResultsControl: PagedResultsControl | undefined;
    const shouldPage = !!options.paged;
    if (shouldPage) {
      pagedResultsControl = new PagedResultsControl({
        value: {
          size: pageSize,
        },
      });
      controls.push(pagedResultsControl);
    }

    let filter: Filter;
    if (options.filter) {
      if (typeof options.filter === 'string') {
        filter = FilterParser.parseString(options.filter);
      } else {
        filter = options.filter;
      }
    } else {
      filter = new PresenceFilter({ attribute: 'objectclass' });
    }

    const searchRequest = new SearchRequest({
      messageId: -1, // NOTE: This will be set from _sendRequest()
      baseDN: typeof baseDN === 'string' ? baseDN : baseDN.toString(),
      scope: options.scope,
      filter,
      attributes: options.attributes,
      explicitBufferAttributes: options.explicitBufferAttributes,
      returnAttributeValues: options.returnAttributeValues,
      sizeLimit: options.sizeLimit,
      timeLimit: options.timeLimit,
      controls,
    });

    const searchResult: SearchResult = {
      searchEntries: [],
      searchReferences: [],
    };

    await this._sendSearch(searchRequest, searchResult, shouldPage, pageSize, pagedResultsControl);

    return searchResult;
  }

  public async *searchPaginated(baseDN: DN | string, options: SearchOptions = {}, controls?: Control | Control[]): AsyncGenerator<SearchResult> {
    if (!this.isConnected) {
      await this._connect();
    }

    if (controls) {
      if (Array.isArray(controls)) {
        controls = controls.slice(0);
      } else {
        controls = [controls];
      }

      // Make sure PagedResultsControl is not specified since it's handled internally
      for (const control of controls) {
        if (control instanceof PagedResultsControl) {
          throw new Error('Should not specify PagedResultsControl');
        }
      }
    } else {
      controls = [];
    }

    let pageSize = 100;
    if (typeof options.paged === 'object' && options.paged.pageSize) {
      pageSize = options.paged.pageSize;
    } else if (options.sizeLimit && options.sizeLimit > 1) {
      // According to the RFC, servers should ignore the paging control if
      // pageSize >= sizelimit.  Some might still send results, but it's safer
      // to stay under that figure when assigning a default value.
      pageSize = options.sizeLimit - 1;
    }

    let pagedResultsControl: PagedResultsControl | undefined;
    pagedResultsControl = new PagedResultsControl({
      value: {
        size: pageSize,
      },
    });
    controls.push(pagedResultsControl);

    let filter: Filter;
    if (options.filter) {
      if (typeof options.filter === 'string') {
        filter = FilterParser.parseString(options.filter);
      } else {
        filter = options.filter;
      }
    } else {
      filter = new PresenceFilter({ attribute: 'objectclass' });
    }

    const searchRequest = new SearchRequest({
      messageId: -1, // NOTE: This will be set from _sendRequest()
      baseDN: typeof baseDN === 'string' ? baseDN : baseDN.toString(),
      scope: options.scope,
      filter,
      attributes: options.attributes,
      explicitBufferAttributes: options.explicitBufferAttributes,
      returnAttributeValues: options.returnAttributeValues,
      sizeLimit: options.sizeLimit,
      timeLimit: options.timeLimit,
      controls,
    });

    do {
      const searchResult: SearchResult = {
        searchEntries: [],
        searchReferences: [],
      };
      // eslint-disable-next-line no-await-in-loop
      pagedResultsControl = await this._sendSearch(searchRequest, searchResult, true, pageSize, pagedResultsControl, false);
      yield searchResult;
    } while (pagedResultsControl);
  }

  /**
   * Unbinds this client from the LDAP server.
   * @returns {void|Promise} void if not connected; otherwise returns a promise to the request to disconnect
   */
  public async unbind(): Promise<void> {
    try {
      if (!this.connected || !this.socket) {
        return;
      }

      const req = new UnbindRequest({
        messageId: this._nextMessageId(),
      });

      await this._send(req);
    } finally {
      this._destroySocket(this.socket);
    }
  }

  public [Symbol.asyncDispose](): Promise<void> {
    return this.unbind();
  }

  private async _sendBind(req: BindRequest): Promise<void> {
    if (!this.isConnected) {
      await this._connect();
    }

    const result = await this._send<BindResponse>(req);
    if (result?.status !== MessageResponseStatus.Success) {
      throw StatusCodeParser.parse(result);
    }
  }

  private async _sendSearch(
    searchRequest: SearchRequest,
    searchResult: SearchResult,
    paged: boolean,
    pageSize: number,
    pagedResultsControl?: PagedResultsControl,
    fetchAll = true,
  ): Promise<PagedResultsControl | undefined> {
    searchRequest.messageId = this._nextMessageId();

    const result = await this._send<SearchResponse>(searchRequest);

    if (result?.status !== MessageResponseStatus.Success && !(result?.status === MessageResponseStatus.SizeLimitExceeded && searchRequest.sizeLimit)) {
      throw StatusCodeParser.parse(result);
    }

    for (const searchEntry of result.searchEntries) {
      searchResult.searchEntries.push(searchEntry.toObject(searchRequest.attributes, searchRequest.explicitBufferAttributes));
    }

    for (const searchReference of result.searchReferences) {
      searchResult.searchReferences.push(...searchReference.uris);
    }

    // Recursively search if paging is specified
    if (paged && (result.searchEntries.length || result.searchReferences.length) && pagedResultsControl) {
      let pagedResultsFromResponse: PagedResultsControl | undefined;
      for (const control of result.controls ?? []) {
        if (control instanceof PagedResultsControl) {
          pagedResultsFromResponse = control;
          break;
        }
      }

      if (pagedResultsFromResponse?.value?.cookie?.length) {
        // Recursively keep searching
        pagedResultsControl.value = pagedResultsControl.value ?? {
          size: pageSize,
        };
        pagedResultsControl.value.cookie = pagedResultsFromResponse.value.cookie;
        if (fetchAll) {
          await this._sendSearch(searchRequest, searchResult, paged, pageSize, pagedResultsControl, true);
        } else {
          return pagedResultsControl;
        }
      }
    }

    return undefined;
  }

  private readonly socketDataHandler = (data: Buffer): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.messageParser) {
      this.messageParser.read(data, this.messageDetailsByMessageId);
    }
  };

  private _nextMessageId(): number {
    this.messageId += 1;
    if (this.messageId >= MAX_MESSAGE_ID) {
      this.messageId = 1;
    }

    return this.messageId;
  }

  /**
   * Open the socket connection
   * @returns {Promise<void>|void}
   * @private
   */
  private _connect(): Promise<void> | void {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      if (this.secure) {
        this.socket = tls.connect(this.port, this.host, this.clientOptions.tlsOptions);
        this.socket.id = v4();
        this.socket.once('secureConnect', () => {
          this._onConnect(resolve);
        });
      } else {
        this.socket = net.connect(this.port, this.host);
        this.socket.id = v4();
        this.socket.once('connect', () => {
          this._onConnect(resolve);
        });
      }

      this.socket.once('error', (err: Error) => {
        this._destroySocket(this.socket);
        reject(err);
      });

      if (this.clientOptions.connectTimeout) {
        this.connectTimer = setTimeout(() => {
          this._destroySocket(this.socket);

          reject(new Error('Connection timeout'));
        }, this.clientOptions.connectTimeout);
      }
    });
  }

  private _onConnect(next: () => void): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = undefined;
    }

    // Clear out event listeners from _connect()
    if (this.socket) {
      this.socket.removeAllListeners('error');
      this.socket.removeAllListeners('connect');
      this.socket.removeAllListeners('secureConnect');
    }

    this.connected = true;

    // region Socket events handlers
    const socketError = (err: Error): void => {
      // Clean up any pending messages
      for (const [key, messageDetails] of this.messageDetailsByMessageId.entries()) {
        if (messageDetails.message instanceof UnbindRequest) {
          // Consider unbind as success since the connection is closed.
          messageDetails.resolve();
        } else {
          messageDetails.reject(
            new Error(
              `Socket error. Message type: ${messageDetails.message.constructor.name} (0x${messageDetails.message.protocolOperation.toString(16)})\n${
                err.message || (err.stack ?? 'Unknown socket error')
              }`,
            ),
          );
        }

        this.messageDetailsByMessageId.delete(key);
      }

      if (this.socket) {
        this.socket.destroy();
      }
    };

    function socketEnd(this: SocketWithId): void {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this) {
        // Acknowledge to other end of the connection that the connection is ended.
        this.end();
      }
    }

    function socketTimeout(this: SocketWithId): void {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this) {
        // Acknowledge to other end of the connection that the connection is ended.
        this.end();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const clientInstance = this;

    function socketClose(this: SocketWithId): void {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this) {
        this.removeListener('error', socketError);
        this.removeListener('close', socketClose);
        this.removeListener('data', clientInstance.socketDataHandler);
        this.removeListener('end', socketEnd);
        this.removeListener('timeout', socketTimeout);
      }

      if (this === clientInstance.socket) {
        clientInstance.connected = false;
        delete clientInstance.socket;

        if (clientInstance.connectTimer) {
          clearTimeout(clientInstance.connectTimer);
          // Timeout get destroyed but also clear up reference
          clientInstance.connectTimer = undefined;
        }
      }

      // Clean up any pending messages
      for (const [key, messageDetails] of clientInstance.messageDetailsByMessageId.entries()) {
        if (messageDetails.socket.id === this.id) {
          if (messageDetails.message instanceof UnbindRequest) {
            // Consider unbind as success since the connection is closed.
            messageDetails.resolve();
          } else {
            messageDetails.reject(
              new Error(
                `Connection closed before message response was received. Message type: ${messageDetails.message.constructor.name} (0x${messageDetails.message.protocolOperation.toString(16)})`,
              ),
            );
          }

          clientInstance.messageDetailsByMessageId.delete(key);
        }
      }
    }
    // endregion

    // Hook up event listeners
    if (this.socket) {
      this.socket.on('error', socketError);
      this.socket.on('close', socketClose);
      this.socket.on('data', this.socketDataHandler);
      this.socket.on('end', socketEnd);
      this.socket.on('timeout', socketTimeout);
    }

    next();
  }

  private _destroySocket(socket?: SocketWithId): void {
    if (socket) {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer);
        this.connectTimer = undefined;
      }

      // Ignore any error since the connection is being closed
      socket.removeAllListeners('error');
      socket.on('error', () => {
        // Ignore NOOP
      });
      // send FIN packet first for the sake of ldap servers
      socket.end();
      socket.destroy();

      if (socket === this.socket) {
        this.connected = false;
        this.socket = undefined;
      }
    }
  }

  /**
   * Sends request message to the ldap server over the connected socket. Each message request is given a
   * unique id (messageId), used to identify the associated response when it is sent back over the socket.
   * @returns {Promise<Message>}
   * @private
   * @param {object} message
   */
  private _send<TMessageResponse extends MessageResponse>(message: Message): Promise<TMessageResponse | undefined> {
    if (!this.connected || !this.socket) {
      throw new Error('Socket connection not established');
    }

    const messageContentBuffer = message.write();

    const messageTimeoutId = this.clientOptions.timeout
      ? setTimeout(() => {
          const messageDetails = this.messageDetailsByMessageId.get(message.messageId.toString());
          if (messageDetails) {
            this._destroySocket(messageDetails.socket);
            messageReject(new Error(`${message.constructor.name}: Operation timed out`));
          }
        }, this.clientOptions.timeout)
      : null;
    // eslint-disable-next-line func-style
    let messageResolve: (messageResponse?: TMessageResponse) => void = () => {
      // Ignore this as a NOOP
    };

    // eslint-disable-next-line func-style
    let messageReject: (err: Error) => void = () => {
      // Ignore this as a NOOP
    };

    const sendPromise = new Promise<TMessageResponse | undefined>((resolve, reject) => {
      messageResolve = resolve;
      messageReject = reject;
    }).finally(() => {
      if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
      }
    });

    this.messageDetailsByMessageId.set(message.messageId.toString(), {
      message,
      // @ts-expect-error - Both parameter types extend MessageResponse but typescript sees them as different types
      resolve: messageResolve,
      reject: messageReject,
      timeoutTimer: messageTimeoutId,
      socket: this.socket,
    });

    if ((message as BindRequest).password) {
      logDebug(
        `Sending message: ${JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/no-misused-spread
          ...message,
          password: '__redacted__',
        })}`,
      );
    } else {
      logDebug(`Sending message: ${JSON.stringify(message)}`);
    }

    // Send the message to the socket
    this.socket.write(messageContentBuffer, () => {
      if (message instanceof AbandonRequest) {
        logDebug(`Abandoned message: ${message.messageId}`);
        this.messageDetailsByMessageId.delete(message.messageId.toString());
        messageResolve();
      } else if (message instanceof UnbindRequest) {
        logDebug('Unbind success. Ending socket');
        if (this.socket) {
          this._destroySocket(this.socket);
        }
      } else {
        // NOTE: messageResolve will be called as 'data' events come from the socket
        logDebug('Message sent successfully.');
      }
    });

    return sendPromise;
  }

  private _handleSendResponse(message: Message): void {
    const messageDetails = this.messageDetailsByMessageId.get(message.messageId.toString());
    if (messageDetails) {
      // When performing a search, an arbitrary number of SearchEntry and SearchReference messages come through with the
      // same messageId as the SearchRequest. Finally, a SearchResponse will come through to complete the request.
      if (message instanceof SearchEntry) {
        messageDetails.searchEntries = messageDetails.searchEntries ?? [];
        messageDetails.searchEntries.push(message);
      } else if (message instanceof SearchReference) {
        messageDetails.searchReferences = messageDetails.searchReferences ?? [];
        messageDetails.searchReferences.push(message);
      } else if (message instanceof SearchResponse) {
        // Assign any previously collected entries & references
        if (messageDetails.searchEntries) {
          message.searchEntries.push(...messageDetails.searchEntries);
        }

        if (messageDetails.searchReferences) {
          message.searchReferences.push(...messageDetails.searchReferences);
        }

        this.messageDetailsByMessageId.delete(message.messageId.toString());
        messageDetails.resolve(message as MessageResponse);
      } else {
        this.messageDetailsByMessageId.delete(message.messageId.toString());
        messageDetails.resolve(message as MessageResponse);
      }
    } else {
      logDebug(`Unable to find details related to message response: ${JSON.stringify(message)}`);
    }
  }
}

import { EventEmitter } from 'events';
import strictEventEmitterTypes from 'strict-event-emitter-types';
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

const MAX_MESSAGE_ID = Math.pow(2, 31) - 1;

export interface ClientOptions {
  /**
   * A valid LDAP URL (proto/host/port only)
   */
  url: string;
  /**
   * Socket path if using AF_UNIX sockets
   */
  socketPath?: string;
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
  resolve: () => void;
  reject: (err: Error) => void;
  timeoutTimer: Timer | null;
}

export interface SearchOptions {
  scope?: 'base' | 'one' | 'sub';
  filter?: string | Filter;
  attributes?: string[];
  returnAttributeValues?: boolean;
  sizeLimit?: number;
  timeLimit?: number;
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
  private readonly messageDetailsByMessageId: { [index: string]: MessageDetails } = {};

  constructor(options: ClientOptions) {
    this.clientOptions = options || {};
    if (!this.clientOptions.timeout) {
      this.clientOptions.timeout = 0;
    }

    if (!this.clientOptions.connectTimeout) {
      this.clientOptions.connectTimeout = 0;
    }

    if (this.clientOptions.strictDN !== false) {
      this.clientOptions.strictDN = true;
    }

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
  }

  /**
   * Performs a simple authentication against the server.
   * @param {string} dn
   * @param {string} [password]
   * @param {Control|Control[]} [controls]
   */
  public async bind(dn: string, password?: string, controls?: Control|[Control]) {
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

    return this._send(req);
  }

  /**
   * Compares an attribute/value pair with an entry on the LDAP server.
   * @param {string} dn - The DN of the entry to compare attributes with
   * @param {string} attribute
   * @param {string} value
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async compare(dn: string, attribute: string, value: string, controls?: Control|[Control]) {
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

    return this._send(req);
  }

  /**
   * Deletes an entry from the LDAP server.
   * @param {string} dn - The DN of the entry to delete
   * @param {Control|Control[]} [controls]
   * @param controls
   */
  public async del(dn: string, controls?: Control|[Control]) {
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
  public async exop(oid: string, value?: string, controls?: Control|[Control]) {
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
  public async modifyDN(dn: string, newDN: string, controls?: Control|[Control]) {
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
   * Note that the defaults for options are a 'base' search, if that's what
   * you want you can just pass in a string for options and it will be treated
   * as the search filter.  Also, you can either pass in programatic Filter
   * objects or a filter string as the filter option.
   *
   * @param {string} baseDN - The DN in the tree to start searching at
   * @param {SearchOptions} options
   * @param {Control|Control[]} [controls]
   */
  public async search(baseDN: string, options: SearchOptions, controls?: Control|[Control]) {
    if (!this.connected) {
      await this._connect();
    }

    if (controls && !Array.isArray(controls)) {
      // tslint:disable-next-line:no-parameter-reassignment
      controls = [controls];
    }

    const req = new SearchRequest({
      messageId: this._nextMessageId(),
      baseDN,
      scope: options.scope,
      filter: options.filter || '(objectclass=*)',
      attributes: options.attributes,
      returnAttributeValues: options.returnAttributeValues,
      sizeLimit: options.sizeLimit,
      timeLimit: options.timeLimit,
      controls,
    });

    // TODO: Handle paging and return results
    return this._send(req);
  }

  /**
   * Unbinds this client from the LDAP server.
   * @returns {void|Promise} void if not connected; otherwise returns a promise to the request to disconnect
   */
  public unbind(controls?: Control|[Control]) {
    if (!this.connected) {
      return;
    }

    const req = new UnbindRequest({
      messageId: this._nextMessageId(),
    });

    return this._send(req);
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
   * @returns {Promise<boolean>} true if connected; otherwise throws
   * @private
   */
  private _connect() {
    if (this.connected) {
      return true;
    }

    return new Promise((resolve, reject) => {
      this.socket = tls.connect(this.port, this.host, this.clientOptions.tlsOptions, () => {
        clearTimeout(this.connectTimer);
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
        this.socket.on('end', () => {
          // Acknowledge to other end of the connection that the connection is ended.
          this.socket.end();
        });
        this.socket.on('timeout', () => {
          this.socket.end();
        });

        return resolve(true);
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

  /**
   * Sends request message to the ldap server over the connected socket.
   * Each message request is given a unique id (messageId), used to identify the associated response when it is sent back over the socket.
   * @returns {Promise}
   * @private
   */
  private _send(message: Message) {
    // let ee: StrictEventEmitter<EventEmitter, Events> = new EventEmitter;
    if (!this.connected || !this.socket) {
      throw new Error('Socket connection not established');
    }

    // tslint:disable no-empty
    let messageResolve: () => void = () => {};
    let messageReject: (err: Error) => void = () => {};
    // tslint:enable no-empty
    const sendPromise = new Promise((resolve, reject) => {
      messageResolve = resolve;
      messageReject = reject;

      this.socket.write(message.write(), () => {
        if (message instanceof AbandonRequest) {
          delete this.messageDetailsByMessageId[message.messageId.toString()];
          resolve();
        } else if (message instanceof UnbindRequest) {
          this.connected = false;
          if (this.socket) {
            // Ignore any error since the connection is being closed
            this.socket.removeAllListeners('error');
            // tslint:disable-next-line:no-empty
            this.socket.on('error', () => {});
            this.socket.end();
          }
        }
      });
    });

    this.messageDetailsByMessageId[message.messageId.toString()] = {
      message,
      resolve: messageResolve,
      reject: messageReject,
      timeoutTimer: this.clientOptions.timeout ? setTimeout(() => {
        return messageReject(new Error(`${message.constructor.name}: Operation timed out`));
      },                                                    this.clientOptions.timeout) : null,
    };

    return sendPromise;
  }
}

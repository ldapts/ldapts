import type { RDNAttributes } from './RDN.js';
import { RDN } from './RDN.js';

/**
 * RDNMap is an interface, that maps every key & value to a specified RDN.
 *
 * Value can be either a string or a list of strings, where every value in the list will
 * get applied to the same key of an RDN.
 */
export type RDNMap = Record<string, string[] | string>;

/**
 * DN class provides chain building of multiple RDNs, which can be later build into
 * escaped string representation.
 */
export class DN {
  private rdns: RDN[] = [];

  public constructor(rdns?: RDN[] | RDNMap) {
    if (rdns) {
      if (Array.isArray(rdns)) {
        this.rdns = rdns;
      } else {
        this.addRDNs(rdns);
      }
    }
  }

  /**
   * Add an RDN component to the DN, consisting of key & value pair.
   * @param {string} key
   * @param {string} value
   * @returns {object} DN
   */
  public addPairRDN(key: string, value: string): this {
    this.rdns.push(new RDN({ [key]: value }));

    return this;
  }

  /**
   * Add a single RDN component to the DN.
   *
   * Note, that this RDN can be compound (single RDN can have multiple key & value pairs).
   * @param {object} rdn
   * @returns {object} DN
   */
  public addRDN(rdn: RDN | RDNAttributes): this {
    if (rdn instanceof RDN) {
      this.rdns.push(rdn);
    } else {
      this.rdns.push(new RDN(rdn));
    }

    return this;
  }

  /**
   * Add multiple RDN components to the DN.
   *
   * This method allows different interfaces to add RDNs into the DN.
   * It can:
   * - join other DN into this DN
   * - join list of RDNs or RDNAttributes into this DN
   * - create RDNs from object map, where every key & value will create a new RDN
   * @param {object|object[]} rdns
   * @returns {object} DN
   */
  public addRDNs(rdns: DN | RDN[] | RDNAttributes[] | RDNMap): this {
    if (rdns instanceof DN) {
      this.rdns.push(...rdns.rdns);
    } else if (Array.isArray(rdns)) {
      for (const rdn of rdns) {
        this.addRDN(rdn);
      }
    } else {
      for (const [name, value] of Object.entries(rdns)) {
        if (Array.isArray(value)) {
          for (const rdnValue of value) {
            this.rdns.push(
              new RDN({
                [name]: rdnValue,
              }),
            );
          }
        } else {
          this.rdns.push(
            new RDN({
              [name]: value,
            }),
          );
        }
      }
    }

    return this;
  }

  public getRDNs(): RDN[] {
    return this.rdns;
  }

  public get(index: number): RDN | undefined {
    return this.rdns[index];
  }

  public set(rdn: RDN | RDNAttributes, index: number): this {
    if (rdn instanceof RDN) {
      this.rdns[index] = rdn;
    } else {
      this.rdns[index] = new RDN(rdn);
    }

    return this;
  }

  public isEmpty(): boolean {
    return !this.rdns.length;
  }

  /**
   * Checks, if this instance of DN is equal to the other DN.
   * @param {object} other
   * @returns true if equal; otherwise false
   */
  public equals(other: DN): boolean {
    if (this.rdns.length !== other.rdns.length) {
      return false;
    }

    for (let i = 0; i < this.rdns.length; i += 1) {
      const rdn = this.rdns[i];
      const otherRdn = other.rdns[i];

      if (rdn == null && otherRdn == null) {
        continue;
      }

      if (rdn == null || otherRdn == null || !rdn.equals(otherRdn)) {
        return false;
      }
    }

    return true;
  }

  public clone(): DN {
    return new DN([...this.rdns]);
  }

  public reverse(): this {
    this.rdns.reverse();

    return this;
  }

  public pop(): RDN | undefined {
    return this.rdns.pop();
  }

  public shift(): RDN | undefined {
    return this.rdns.shift();
  }

  /**
   * Parse the DN, escape values & return a string representation.
   * @returns String representation of DN
   */
  public toString(): string {
    let str = '';

    for (const rdn of this.rdns) {
      if (str.length) {
        str += ',';
      }

      str += rdn.toString();
    }

    return str;
  }
}

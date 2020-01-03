import { RDN, RDNAttributes } from './RDN';

/**
 * RDNMap is an interface, that maps every key & value to a specified RDN.
 *
 * Value can be either a string or a list of strings, where every value in the list will
 * get applied to the same key of an RDN.
 */
export interface RDNMap {
  [name: string]: string | string[];
}

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
  public addPairRDN(key: string, value: string): DN {
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
  public addRDN(rdn: RDN | RDNAttributes): DN {
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
  public addRDNs(rdns: RDN[] | RDNAttributes[] | RDNMap | DN): DN {
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
            this.rdns.push(new RDN({
              [name]: rdnValue,
            }));
          }
        } else {
          this.rdns.push(new RDN({
            [name]: value,
          }));
        }
      }
    }

    return this;
  }

  public getRDNs(): RDN[] {
    return this.rdns;
  }

  public get(index: number): RDN {
    return this.rdns[index];
  }

  public set(rdn: RDN | RDNAttributes, index: number): DN {
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
   */
  public equals(other: DN): boolean {
    if (this.rdns.length !== other.rdns.length) {
      return false;
    }

    for (let i = 0; i < this.rdns.length; i += 1) {
      if (!this.rdns[i].equals(other.rdns[i])) {
        return false;
      }
    }

    return true;
  }

  public parent(): DN | null {
    if (this.rdns.length !== 0) {
      const save = this.rdns.shift() as RDN;
      const dn = new DN(this.rdns);
      this.rdns.unshift(save);
      return dn;
    }

    return null;
  }

  public parentOf(dn: DN): boolean {
    if (this.rdns.length >= dn.rdns.length) {
      return false;
    }

    const diff = dn.rdns.length - this.rdns.length;
    for (let i = this.rdns.length - 1; i >= 0; i -= 1) {
      const myRDN = this.rdns[i];
      const theirRDN = dn.rdns[i + diff];

      if (!myRDN.equals(theirRDN)) {
        return false;
      }
    }

    return true;
  }

  public clone(): DN {
    return new DN(this.rdns);
  }

  public reverse(): DN {
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
   */
  public toString(): string {
    let str = '';

    for (const rdn of this.rdns) {
      if (str.length) {
        str += ',';
      }

      str += `${rdn.toString()}`;
    }

    return str;
  }
}

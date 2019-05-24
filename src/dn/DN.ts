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

  constructor(rdns?: RDN[] | RDNMap) {
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
   *
   * @param key
   * @param value
   * @returns DN
   */
  public addPairRDN(key: string, value: string) {
    this.rdns.push(new RDN({ [key]: value }));

    return this;
  }

  /**
   * Add a single RDN component to the DN.
   *
   * Note, that this RDN can be compound (single RDN can have multiple key & value pairs).
   * @param rdn
   * @returns DN
   */
  public addRDN(rdn: RDN | RDNAttributes) {
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
   *
   * @param rdns
   * @returns DN
   */
  public addRDNs(rdns: RDN[] | RDNAttributes[] | RDNMap | DN) {
    if (rdns instanceof DN) {
      this.rdns = [...this.rdns, ...rdns.rdns];
    } else if (Array.isArray(rdns)) {
      rdns.forEach((rdn: RDN | RDNAttributes) => this.addRDN(rdn));
    } else {
      Object.keys(rdns).map((name) => {
        const value = rdns[name];

        if (Array.isArray(value)) {
          value.forEach((v) => this.rdns.push(new RDN({ [name]: v })));
        } else {
          this.rdns.push(new RDN({ [name]: value }));
        }
      });
    }

    return this;
  }

  public getRDNs() {
    return this.rdns;
  }

  public get(index: number) {
    return this.rdns[index];
  }

  public set(rdn: RDN | RDNAttributes, index: number) {
    if (rdn instanceof RDN) {
      this.rdns[index] = rdn;
    } else {
      this.rdns[index] = new RDN(rdn);
    }

    return this;
  }

  public isEmpty() {
    return this.rdns.length === 0;
  }

  /**
   * Checks, if this instance of DN is equal to the other DN.
   *
   * @param other
   */
  public equals(other: DN) {
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

  public parent() {
    if (this.rdns.length !== 0) {
      const save = this.rdns.shift() as RDN;
      const dn = new DN(this.rdns);
      this.rdns.unshift(save);
      return dn;
    }

    return null;
  }

  public parentOf(dn: DN) {
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

  public clone() {
    return new DN(this.rdns);
  }

  public reverse() {
    this.rdns.reverse();

    return this;
  }

  public pop() {
    return this.rdns.pop();
  }

  public shift() {
    return this.rdns.shift();
  }

  /**
   * Parse the DN, escape values & return a string representation.
   */
  public toString() {
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


import { RDN, RDNAttributes } from './RDN';

export interface DNAttributes {
  [name: string]: string;
}

/**
 * DN provides chain building of multiple RDNs.
 */
export class DN {
  private rdns: RDN[] = [];

  constructor(rdns?: RDN[] | DNAttributes) {
    if (rdns) {
      if (Array.isArray(rdns)) {
        this.rdns = rdns;
      } else {
        this.rdns = Object.keys(rdns).map((name) => new RDN({ [name]: rdns[name] }));
      }
    }
  }

  /**
   * Add an RDN component to the DN, where every key & value pair will create a new RDN.
   *
   * @param attrs
   */
  public add(attrs: DNAttributes) {
    this.rdns = [...this.rdns, ...Object.keys(attrs).map((name) => new RDN({ [name]: attrs[name] }))];
    return this;
  }

  /**
   * Add an RDN component to the DN, consisting of key & value pair.
   *
   * @param key
   * @param value
   * @returns DN
   */
  public addPair(key: string, value: string) {
    this.rdns.push(new RDN({ [key]: value }));
    return this;
  }

  /**
   * Add an RDN component to the DN.
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

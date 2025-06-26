const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

export class Bech32 {
  private static polymod(values: number[]): number {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    
    for (const value of values) {
      const top = chk >> 25;
      chk = (chk & 0x1ffffff) << 5 ^ value;
      for (let i = 0; i < 5; i++) {
        chk ^= ((top >> i) & 1) ? GEN[i] : 0;
      }
    }
    
    return chk;
  }
  
  private static hrpExpand(hrp: string): number[] {
    const result = [];
    for (let i = 0; i < hrp.length; i++) {
      result.push(hrp.charCodeAt(i) >> 5);
    }
    result.push(0);
    for (let i = 0; i < hrp.length; i++) {
      result.push(hrp.charCodeAt(i) & 31);
    }
    return result;
  }
  
  private static verifyChecksum(hrp: string, data: number[]): boolean {
    return this.polymod(this.hrpExpand(hrp).concat(data)) === 1;
  }
  
  private static createChecksum(hrp: string, data: number[]): number[] {
    const values = this.hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
    const mod = this.polymod(values) ^ 1;
    const ret = [];
    for (let i = 0; i < 6; i++) {
      ret.push((mod >> 5 * (5 - i)) & 31);
    }
    return ret;
  }
  
  static encode(hrp: string, data: number[]): string {
    const checksum = this.createChecksum(hrp, data);
    const combined = data.concat(checksum);
    let result = hrp + '1';
    for (const d of combined) {
      result += BECH32_ALPHABET[d];
    }
    return result;
  }
  
  static decode(addr: string): { hrp: string; data: number[] } | null {
    const pos = addr.lastIndexOf('1');
    if (pos < 1 || pos + 7 > addr.length || addr.length > 90) {
      return null;
    }
    
    const hrp = addr.substring(0, pos);
    const data = [];
    
    for (let i = pos + 1; i < addr.length; i++) {
      const d = BECH32_ALPHABET.indexOf(addr[i]);
      if (d === -1) return null;
      data.push(d);
    }
    
    if (!this.verifyChecksum(hrp, data)) return null;
    
    return { hrp, data: data.slice(0, -6) };
  }
  
  static convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
    let acc = 0;
    let bits = 0;
    const result = [];
    const maxv = (1 << toBits) - 1;
    
    for (const value of data) {
      if (value < 0 || value >> fromBits) return null;
      acc = (acc << fromBits) | value;
      bits += fromBits;
      while (bits >= toBits) {
        bits -= toBits;
        result.push((acc >> bits) & maxv);
      }
    }
    
    if (pad) {
      if (bits) result.push((acc << (toBits - bits)) & maxv);
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
      return null;
    }
    
    return result;
  }
}
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export class Base58 {
  static encode(bytes: Uint8Array): string {
    if (bytes.length === 0) return '';
    
    let num = 0n;
    for (const byte of bytes) {
      num = num * 256n + BigInt(byte);
    }
    
    let encoded = '';
    while (num > 0) {
      const remainder = Number(num % 58n);
      num = num / 58n;
      encoded = BASE58_ALPHABET[remainder] + encoded;
    }
    
    // Add leading zeros
    for (const byte of bytes) {
      if (byte === 0) {
        encoded = '1' + encoded;
      } else {
        break;
      }
    }
    
    return encoded;
  }
  
  static decode(str: string): Uint8Array {
    if (str.length === 0) return new Uint8Array(0);
    
    let num = 0n;
    for (const char of str) {
      const index = BASE58_ALPHABET.indexOf(char);
      if (index === -1) throw new Error('Invalid Base58 character');
      num = num * 58n + BigInt(index);
    }
    
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }
    
    // Add leading zeros
    for (const char of str) {
      if (char === '1') {
        bytes.unshift(0);
      } else {
        break;
      }
    }
    
    return new Uint8Array(bytes);
  }
  
  static encodeCheck(bytes: Uint8Array): Promise<string> {
    return new Promise(async (resolve) => {
      const { BitcoinCrypto } = await import('./crypto');
      const hash = await BitcoinCrypto.doubleSha256(bytes);
      const checksum = hash.slice(0, 4);
      const payload = new Uint8Array(bytes.length + 4);
      payload.set(bytes);
      payload.set(checksum, bytes.length);
      resolve(this.encode(payload));
    });
  }
  
  static decodeCheck(str: string): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
      try {
        const { BitcoinCrypto } = await import('./crypto');
        const decoded = this.decode(str);
        if (decoded.length < 4) throw new Error('Invalid length');
        
        const payload = decoded.slice(0, -4);
        const checksum = decoded.slice(-4);
        const hash = await BitcoinCrypto.doubleSha256(payload);
        
        for (let i = 0; i < 4; i++) {
          if (checksum[i] !== hash[i]) {
            throw new Error('Invalid checksum');
          }
        }
        
        resolve(payload);
      } catch (error) {
        reject(error);
      }
    });
  }
}
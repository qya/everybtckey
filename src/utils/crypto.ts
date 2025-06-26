export class BitcoinCrypto {
  private static secp256k1Order = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  
  static async generatePrivateKey(): Promise<Uint8Array> {
    let privateKey: Uint8Array;
    
    do {
      privateKey = new Uint8Array(32);
      crypto.getRandomValues(privateKey);
    } while (this.bytesToBigInt(privateKey) >= this.secp256k1Order || this.bytesToBigInt(privateKey) === 0n);
    
    return privateKey;
  }
  
  static async getPublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // For Bitcoin, we need secp256k1, but we'll simulate it for this demo
    // In production, you'd use a proper secp256k1 implementation
    return this.simulateSecp256k1PublicKey(privateKey);
  }
  
  private static simulateSecp256k1PublicKey(privateKey: Uint8Array): Uint8Array {
    // This creates a deterministic public key based on private key
    // Same private key will ALWAYS produce the same public key
    const compressed = new Uint8Array(33);
    compressed[0] = 0x02; // Compressed public key prefix
    
    // Create a deterministic public key using a more sophisticated method
    let hash = 0;
    for (let i = 0; i < privateKey.length; i++) {
      hash = ((hash << 5) - hash + privateKey[i]) & 0xffffffff;
    }
    
    // Generate deterministic but varied public key
    for (let i = 0; i < 32; i++) {
      const seed = (hash + i * 1337) & 0xffffffff;
      compressed[i + 1] = (privateKey[i] ^ (seed % 256)) & 0xff;
    }
    
    return compressed;
  }
  
  static async sha256(data: Uint8Array): Promise<Uint8Array> {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
  }
  
  static async doubleSha256(data: Uint8Array): Promise<Uint8Array> {
    const firstHash = await this.sha256(data);
    return await this.sha256(firstHash);
  }
  
  static async ripemd160(data: Uint8Array): Promise<Uint8Array> {
    // Deterministic RIPEMD160 simulation - same input always produces same output
    const hash = await this.sha256(data);
    
    // Create a deterministic 20-byte hash from the 32-byte SHA256
    const result = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      result[i] = hash[i] ^ hash[i + 12]; // XOR with offset for variation
    }
    
    return result;
  }
  
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
  
  static bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (const byte of bytes) {
      result = (result << 8n) + BigInt(byte);
    }
    return result;
  }
  
  static bigIntToBytes(bigint: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    let value = bigint;
    
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(value & 0xFFn);
      value = value >> 8n;
    }
    
    return bytes;
  }
}
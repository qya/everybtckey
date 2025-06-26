import { BitcoinCrypto } from './crypto';
import { Base58 } from './base58';
import { Bech32 } from './bech32';

export interface BitcoinKey {
  id: string;
  privateKeyHex: string;
  privateKeyWIF: string;
  publicKey: string;
  addresses: {
    legacy: string;
    segwit: string;
    nativeSegwit: string;
  };
  balances: {
    legacy: number | null;
    segwit: number | null;
    nativeSegwit: number | null;
  };
  timestamp: number;
  index: number;
}

interface BlockchainInfoResponse {
  hash160: string;
  address: string;
  n_tx: number;
  n_unredeemed: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
}

export class BitcoinKeyGenerator {
  // Fixed seed for deterministic generation - this makes it appear as a "leaked" database
  private static readonly MASTER_SEED = new Uint8Array([
    0x42, 0x69, 0x74, 0x63, 0x6f, 0x69, 0x6e, 0x20, // "Bitcoin "
    0x4c, 0x65, 0x61, 0x6b, 0x65, 0x64, 0x20, 0x44, // "Leaked D"
    0x61, 0x74, 0x61, 0x62, 0x61, 0x73, 0x65, 0x20, // "atabase "
    0x32, 0x30, 0x32, 0x35, 0x00, 0x00, 0x00, 0x00  // "2025" + padding
  ]);
  
  // Rate limiting for API calls
  private static lastApiCall = 0;
  private static readonly API_RATE_LIMIT = 1000; // 1 second between calls
  private static balanceCache = new Map<string, { balance: number; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  static async generateKey(): Promise<BitcoinKey> {
    const privateKey = await BitcoinCrypto.generatePrivateKey();
    return this.generateKeyFromPrivateKey(privateKey, Date.now());
  }
  
  // Generate a completely fixed private key based on index
  static generateFixedPrivateKeyFromIndex(index: number): Uint8Array {
    const privateKey = new Uint8Array(32);
    
    // Create deterministic private key using master seed + index
    // This ensures the same index ALWAYS produces the same private key
    const indexBytes = new ArrayBuffer(8);
    const view = new DataView(indexBytes);
    view.setBigUint64(0, BigInt(index), false);
    const indexArray = new Uint8Array(indexBytes);
    
    // Combine master seed with index in a deterministic way
    for (let i = 0; i < 32; i++) {
      const seedByte = this.MASTER_SEED[i % this.MASTER_SEED.length];
      const indexByte = indexArray[i % 8];
      const positionByte = (index + i) % 256;
      
      // Create a deterministic but varied pattern
      privateKey[i] = (seedByte ^ indexByte ^ positionByte) % 256;
    }
    
    // Ensure it's a valid private key for secp256k1
    return this.ensureValidPrivateKeySync(privateKey, index);
  }
  
  // Synchronous version for deterministic generation
  private static ensureValidPrivateKeySync(seed: Uint8Array, index: number): Uint8Array {
    const maxKey = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140');
    let keyBigInt = BitcoinCrypto.bytesToBigInt(seed);
    
    // If key is invalid, modify it deterministically based on index
    let attempts = 0;
    while ((keyBigInt >= maxKey || keyBigInt === 0n) && attempts < 10) {
      // Modify the key deterministically
      keyBigInt = (keyBigInt ^ BigInt(index + attempts * 1337)) % maxKey;
      if (keyBigInt === 0n) keyBigInt = BigInt(index + 1);
      attempts++;
    }
    
    return BitcoinCrypto.bigIntToBytes(keyBigInt);
  }
  
  // Determine if a key at this index should have a balance (deterministic)
  static shouldHaveBalance(index: number): boolean {
    // Use a deterministic pattern - certain indices will always have balances
    const hash = (index * 1337 + 42) % 10000;
    return hash < 10; // 0.1% of keys have balances
  }
  
  // Get fixed balance amounts for keys that should have balances
  static getFixedBalance(index: number): { legacy: number; segwit: number; nativeSegwit: number } {
    // Generate deterministic balance amounts based on index
    const seed = (index * 7919 + 1337) % 1000000;
    const legacy = (seed % 3 === 0) ? (seed % 100000) / 100000000 : 0; // Up to 0.001 BTC
    const segwit = (seed % 5 === 0) ? (seed % 50000) / 100000000 : 0;
    const nativeSegwit = (seed % 7 === 0) ? (seed % 25000) / 100000000 : 0;
    
    return { legacy, segwit, nativeSegwit };
  }
  
  static async generateKeyFromSeed(seed: Uint8Array, index: number): Promise<BitcoinKey> {
    // Ensure the seed is a valid private key
    const privateKey = await this.ensureValidPrivateKey(seed);
    return this.generateKeyFromPrivateKey(privateKey, index);
  }
  
  private static async ensureValidPrivateKey(seed: Uint8Array): Promise<Uint8Array> {
    // Make sure the key is within the valid range for secp256k1
    const maxKey = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140');
    let keyBigInt = BitcoinCrypto.bytesToBigInt(seed);
    
    // If key is too large or zero, hash it to get a valid key
    if (keyBigInt >= maxKey || keyBigInt === 0n) {
      const hashed = await BitcoinCrypto.sha256(seed);
      keyBigInt = BitcoinCrypto.bytesToBigInt(hashed);
      
      // If still invalid, keep hashing
      let attempts = 0;
      while ((keyBigInt >= maxKey || keyBigInt === 0n) && attempts < 10) {
        const newHash = await BitcoinCrypto.sha256(BitcoinCrypto.bigIntToBytes(keyBigInt));
        keyBigInt = BitcoinCrypto.bytesToBigInt(newHash);
        attempts++;
      }
    }
    
    return BitcoinCrypto.bigIntToBytes(keyBigInt);
  }
  
  static async generateKeyFromPrivateKey(privateKey: Uint8Array, indexOrTimestamp: number): Promise<BitcoinKey> {
    const publicKey = await BitcoinCrypto.getPublicKey(privateKey);
    
    const privateKeyHex = BitcoinCrypto.bytesToHex(privateKey);
    const privateKeyWIF = await this.privateKeyToWIF(privateKey);
    const publicKeyHex = BitcoinCrypto.bytesToHex(publicKey);
    
    const addresses = await this.deriveAddresses(publicKey);
    
    const isIndex = indexOrTimestamp < 1000000000000; // Distinguish between index and timestamp
    
    return {
      id: `key-${indexOrTimestamp}`,
      privateKeyHex,
      privateKeyWIF,
      publicKey: publicKeyHex,
      addresses,
      balances: {
        legacy: null,
        segwit: null,
        nativeSegwit: null,
      },
      timestamp: isIndex ? Date.now() : indexOrTimestamp,
      index: isIndex ? indexOrTimestamp : 0,
    };
  }
  
  private static async privateKeyToWIF(privateKey: Uint8Array): Promise<string> {
    const extended = new Uint8Array(34);
    extended[0] = 0x80; // Mainnet private key prefix
    extended.set(privateKey, 1);
    extended[33] = 0x01; // Compressed public key flag
    
    return await Base58.encodeCheck(extended);
  }
  
  private static async deriveAddresses(publicKey: Uint8Array): Promise<BitcoinKey['addresses']> {
    // Legacy P2PKH Address
    const pubKeyHash = await BitcoinCrypto.ripemd160(await BitcoinCrypto.sha256(publicKey));
    const legacyPayload = new Uint8Array(21);
    legacyPayload[0] = 0x00; // Mainnet P2PKH version
    legacyPayload.set(pubKeyHash, 1);
    const legacy = await Base58.encodeCheck(legacyPayload);
    
    // SegWit P2SH Address (P2WPKH-P2SH)
    const redeemScript = new Uint8Array(22);
    redeemScript[0] = 0x00; // OP_0
    redeemScript[1] = 0x14; // Push 20 bytes
    redeemScript.set(pubKeyHash, 2);
    
    const scriptHash = await BitcoinCrypto.ripemd160(await BitcoinCrypto.sha256(redeemScript));
    const segwitPayload = new Uint8Array(21);
    segwitPayload[0] = 0x05; // Mainnet P2SH version
    segwitPayload.set(scriptHash, 1);
    const segwit = await Base58.encodeCheck(segwitPayload);
    
    // Native SegWit Bech32 Address (P2WPKH)
    const witnessVersion = 0;
    const witnessProgram = Array.from(pubKeyHash);
    const converted = Bech32.convertBits(witnessProgram, 8, 5, true);
    if (!converted) throw new Error('Failed to convert witness program');
    
    const nativeSegwit = Bech32.encode('bc', [witnessVersion].concat(converted));
    
    return {
      legacy,
      segwit,
      nativeSegwit,
    };
  }
  
  /**
   * Check Bitcoin address balance using Blockchain.info API
   * @param address Bitcoin address to check
   * @returns Balance in BTC (converted from satoshis)
   */
  static async checkBalance(address: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.balanceCache.get(address);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.balance;
      }
      
      // Rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.API_RATE_LIMIT) {
        await new Promise(resolve => setTimeout(resolve, this.API_RATE_LIMIT - timeSinceLastCall));
      }
      
      this.lastApiCall = Date.now();
      
      // Make API call to Blockchain.info
      const response = await fetch(`https://blockchain.info/rawaddr/${address}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BitcoinKeyChecker/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limited by Blockchain.info API');
          return 0;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: BlockchainInfoResponse = await response.json();
      
      // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
      const balanceInBTC = data.final_balance / 100000000;
      
      // Cache the result
      this.balanceCache.set(address, {
        balance: balanceInBTC,
        timestamp: Date.now()
      });
      
      return balanceInBTC;
      
    } catch (error) {
      console.error(`Error checking balance for ${address}:`, error);
      
      // Return 0 for network errors, but don't cache the result
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error - falling back to 0 balance');
        return 0;
      }
      
      // For other errors, return 0 but log the issue
      return 0;
    }
  }
  
  /**
   * Check balances for all address types of a Bitcoin key
   * @param key Bitcoin key with addresses
   * @returns Updated key with balance information
   */
  static async checkAllBalances(key: BitcoinKey): Promise<BitcoinKey> {
    try {
      // Check balances for all address types in parallel
      const [legacyBalance, segwitBalance, nativeSegwitBalance] = await Promise.all([
        this.checkBalance(key.addresses.legacy),
        this.checkBalance(key.addresses.segwit),
        this.checkBalance(key.addresses.nativeSegwit)
      ]);
      
      return {
        ...key,
        balances: {
          legacy: legacyBalance > 0 ? legacyBalance : null,
          segwit: segwitBalance > 0 ? segwitBalance : null,
          nativeSegwit: nativeSegwitBalance > 0 ? nativeSegwitBalance : null,
        }
      };
    } catch (error) {
      console.error('Error checking balances for key:', error);
      return key; // Return original key if balance checking fails
    }
  }
  
  /**
   * Clear the balance cache (useful for testing or manual refresh)
   */
  static clearBalanceCache(): void {
    this.balanceCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.balanceCache.size,
      entries: Array.from(this.balanceCache.keys())
    };
  }
}
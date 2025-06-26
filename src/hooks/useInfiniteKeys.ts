import { useState, useEffect, useCallback, useRef } from 'react';
import { BitcoinKey, BitcoinKeyGenerator } from '../utils/bitcoin';

interface UseInfiniteKeysReturn {
  keys: BitcoinKey[];
  loading: boolean;
  loadMore: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredKeys: BitcoinKey[];
  hasMore: boolean;
  totalVirtualKeys: number;
  searchLoading: boolean;
  searchCompleted: boolean;
  checkKeyBalance: (key: BitcoinKey) => Promise<void>;
}

const BATCH_SIZE = 50;
const TOTAL_POSSIBLE_KEYS = 2**256; // Theoretical maximum Bitcoin private keys
const RATE_LIMIT_MS = 50;
const SEARCH_BATCH_SIZE = 1000; // How many keys to check when searching
const MAX_SEARCH_RESULTS = 100; // Maximum search results to show

export function useInfiniteKeys(): UseInfiniteKeysReturn {
  const [keys, setKeys] = useState<BitcoinKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<BitcoinKey[]>([]);
  const lastGenerationTime = useRef(0);
  const searchAbortController = useRef<AbortController | null>(null);
  const generatedKeyIds = useRef<Set<string>>(new Set()); // Track generated key IDs
  const balanceCheckQueue = useRef<Set<string>>(new Set()); // Track keys being checked for balance
  
  // Fixed deterministic key generation based on ID number
  const generateKeyAtIndex = useCallback(async (index: number): Promise<BitcoinKey> => {
    // Create a completely deterministic private key based on index
    // This makes it appear as if we have a fixed "leaked" database
    const privateKey = BitcoinKeyGenerator.generateFixedPrivateKeyFromIndex(index);
    return await BitcoinKeyGenerator.generateKeyFromPrivateKey(privateKey, index);
  }, []);
  
  // Check balance for a key and update it - now exported for on-demand use
  const checkKeyBalance = useCallback(async (key: BitcoinKey) => {
    if (balanceCheckQueue.current.has(key.id)) return; // Already being checked
    
    balanceCheckQueue.current.add(key.id);
    
    try {
      const updatedKey = await BitcoinKeyGenerator.checkAllBalances(key);
      
      // Update the key in the state
      setKeys(prevKeys => 
        prevKeys.map(k => k.id === updatedKey.id ? updatedKey : k)
      );
      
      // Also update search results if this key is in search results
      setSearchResults(prevResults => 
        prevResults.map(k => k.id === updatedKey.id ? updatedKey : k)
      );
    } catch (error) {
      console.error('Error checking balance for key:', key.id, error);
    } finally {
      balanceCheckQueue.current.delete(key.id);
    }
  }, []);
  
  // Search through virtual keys that aren't loaded yet
  const searchVirtualKeys = useCallback(async (searchTerm: string, signal: AbortSignal): Promise<BitcoinKey[]> => {
    if (!searchTerm || searchTerm.length < 3) return [];
    
    const results: BitcoinKey[] = [];
    const term = searchTerm.toLowerCase();
    const foundKeyIds = new Set<string>(); // Track found key IDs to prevent duplicates
    let searchIndex = 0;
    let foundCount = 0;
    
    // Search through virtual keys in batches
    while (foundCount < MAX_SEARCH_RESULTS && searchIndex < 100000) {
      if (signal.aborted) break;
      
      const batchPromises: Promise<BitcoinKey>[] = [];
      for (let i = 0; i < SEARCH_BATCH_SIZE && searchIndex < 100000; i++, searchIndex++) {
        batchPromises.push(generateKeyAtIndex(searchIndex));
      }
      
      try {
        const batch = await Promise.all(batchPromises);
        
        for (const key of batch) {
          if (signal.aborted) break;
          
          // Skip if we've already found this key ID
          if (foundKeyIds.has(key.id)) continue;
          
          // Check if this key matches the search term
          const matches = (
            key.privateKeyHex.toLowerCase().includes(term) ||
            key.privateKeyWIF.toLowerCase().includes(term) ||
            key.addresses.legacy.toLowerCase().includes(term) ||
            key.addresses.segwit.toLowerCase().includes(term) ||
            key.addresses.nativeSegwit.toLowerCase().includes(term)
          );
          
          if (matches) {
            foundKeyIds.add(key.id);
            results.push(key);
            foundCount++;
            
            // REMOVED: Automatic balance checking to prevent rate limiting
            // checkKeyBalance(key);
            
            if (foundCount >= MAX_SEARCH_RESULTS) break;
          }
        }
        
        // Add a small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        if (!signal.aborted) {
          console.error('Error in search batch:', error);
        }
        break;
      }
    }
    
    return results;
  }, [generateKeyAtIndex]);
  
  // Enhanced search that includes both loaded keys and virtual prediction
  const performSearch = useCallback(async (term: string) => {
    // Cancel any ongoing search
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    
    if (!term || term.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchCompleted(false);
      return;
    }
    
    setSearchLoading(true);
    setSearchCompleted(false);
    searchAbortController.current = new AbortController();
    
    try {
      // First, search through loaded keys
      const loadedMatches = keys.filter(key => {
        const searchTerm = term.toLowerCase();
        return (
          key.privateKeyHex.toLowerCase().includes(searchTerm) ||
          key.privateKeyWIF.toLowerCase().includes(searchTerm) ||
          key.addresses.legacy.toLowerCase().includes(searchTerm) ||
          key.addresses.segwit.toLowerCase().includes(searchTerm) ||
          key.addresses.nativeSegwit.toLowerCase().includes(searchTerm)
        );
      });
      
      // Then search through virtual keys (predictive search)
      const virtualMatches = await searchVirtualKeys(term, searchAbortController.current.signal);
      
      // Combine results, removing duplicates by ID
      const combinedResults = new Map<string, BitcoinKey>();
      
      // Add loaded matches first
      loadedMatches.forEach(key => {
        combinedResults.set(key.id, key);
      });
      
      // Add virtual matches, but only if not already present
      virtualMatches.forEach(key => {
        if (!combinedResults.has(key.id)) {
          combinedResults.set(key.id, key);
        }
      });
      
      // Convert back to array and sort by index
      const allMatches = Array.from(combinedResults.values())
        .sort((a, b) => a.index - b.index);
      
      if (!searchAbortController.current.signal.aborted) {
        setSearchResults(allMatches);
        setSearchCompleted(true);
      }
    } catch (error) {
      if (!searchAbortController.current?.signal.aborted) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSearchCompleted(true);
      }
    } finally {
      if (!searchAbortController.current?.signal.aborted) {
        setSearchLoading(false);
      }
    }
  }, [keys, searchVirtualKeys]);
  
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);
  
  // Clear search results when search term is cleared
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchCompleted(false);
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    }
  }, [searchTerm]);
  
  const generateKeys = useCallback(async (startIndex: number, count: number) => {
    const now = Date.now();
    if (now - lastGenerationTime.current < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }
    
    const newKeys: BitcoinKey[] = [];
    for (let i = 0; i < count; i++) {
      const keyIndex = startIndex + i;
      
      // Skip if we've already generated this key
      const keyId = `key-${keyIndex}`;
      if (generatedKeyIds.current.has(keyId)) {
        continue;
      }
      
      try {
        const key = await generateKeyAtIndex(keyIndex);
        
        // Mark this key ID as generated
        generatedKeyIds.current.add(key.id);
        
        newKeys.push(key);
        
        // REMOVED: Automatic balance checking to prevent rate limiting
        // Only check balance when user explicitly expands the key
        
      } catch (error) {
        console.error('Error generating key:', error);
      }
    }
    
    lastGenerationTime.current = Date.now();
    return newKeys;
  }, [generateKeyAtIndex]);
  
  const loadMore = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const newKeys = await generateKeys(currentIndex, BATCH_SIZE);
      
      // Filter out any keys that might already exist (extra safety)
      setKeys(prevKeys => {
        const existingIds = new Set(prevKeys.map(k => k.id));
        const uniqueNewKeys = newKeys.filter(k => !existingIds.has(k.id));
        return [...prevKeys, ...uniqueNewKeys];
      });
      
      setCurrentIndex(prev => prev + BATCH_SIZE);
    } catch (error) {
      console.error('Error loading more keys:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, currentIndex, generateKeys]);
  
  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // Only run once on mount
  
  // Return search results if searching, otherwise return loaded keys
  const filteredKeys = searchTerm ? searchResults : keys;
  
  return {
    keys,
    loading,
    loadMore,
    searchTerm,
    setSearchTerm,
    filteredKeys,
    hasMore: !searchTerm, // Only allow loading more when not searching
    totalVirtualKeys: TOTAL_POSSIBLE_KEYS,
    searchLoading,
    searchCompleted,
    checkKeyBalance, // Export for on-demand use
  };
}
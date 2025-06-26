import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Star, Loader2, AlertCircle } from 'lucide-react';
import { BitcoinKey } from '../utils/bitcoin';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

interface KeyEntryProps {
  bitcoinKey: BitcoinKey;
  index: number;
  onCheckBalance: (key: BitcoinKey) => Promise<void>;
}

export function KeyEntry({ bitcoinKey, index, onCheckBalance }: KeyEntryProps) {
  const { t } = useLanguage();
  const { blockchainInfoEnabled } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [hasCheckedBalance, setHasCheckedBalance] = useState(false);
  
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const handleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Only check balance when expanding, haven't checked before, and blockchain info is enabled
    if (newExpanded && !hasCheckedBalance && !isCheckingBalance && blockchainInfoEnabled) {
      setIsCheckingBalance(true);
      try {
        await onCheckBalance(bitcoinKey);
        setHasCheckedBalance(true);
      } catch (error) {
        console.error('Error checking balance:', error);
      } finally {
        setIsCheckingBalance(false);
      }
    }
  };
  
  const CopyButton = ({ text, itemId }: { text: string; itemId: string }) => {
    const isCopied = copiedItems.has(itemId);
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(text, itemId);
        }}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        title={t('copyToClipboard')}
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
        )}
      </button>
    );
  };
  
  const formatBalance = (balance: number | null) => {
    if (balance === null) return null;
    if (balance === 0) return null;
    return balance.toFixed(8);
  };
  
  const hasBalance = bitcoinKey.balances.legacy || bitcoinKey.balances.segwit || bitcoinKey.balances.nativeSegwit;
  
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      <div 
        className="flex items-start py-3 px-2 sm:px-4 cursor-pointer"
        onClick={handleExpand}
      >
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <span className="text-sm text-gray-400 dark:text-gray-500 font-mono w-6 sm:w-8 text-right flex-shrink-0 mt-0.5">
            {String(index).padStart(2, '0')}
          </span>
          
          <div className="flex items-start space-x-1 sm:space-x-2 flex-shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          
          {/* Private key with proper mobile wrapping */}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 break-all leading-relaxed">
              {bitcoinKey.privateKeyHex}
            </div>
          </div>
          
          <div className="flex items-start space-x-1 sm:space-x-2 flex-shrink-0 mt-0.5">
            {isCheckingBalance && (
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            )}
            {hasBalance && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            )}
            <CopyButton text={bitcoinKey.privateKeyHex} itemId={`${bitcoinKey.id}-hex-main`} />
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-2 sm:px-4 py-4 transition-colors">
          <div className="space-y-4">
            {/* Private Key Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('privateKey')}</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('hexadecimal')}</span>
                  <CopyButton text={bitcoinKey.privateKeyHex} itemId={`${bitcoinKey.id}-hex`} />
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded break-all leading-relaxed">
                  {bitcoinKey.privateKeyHex}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('wif')}</span>
                  <CopyButton text={bitcoinKey.privateKeyWIF} itemId={`${bitcoinKey.id}-wif`} />
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded break-all leading-relaxed">
                  {bitcoinKey.privateKeyWIF}
                </div>
              </div>
            </div>
            
            {/* Addresses Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('addresses')}</h4>
                {!blockchainInfoEnabled && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t('balanceCheckDisabled')}</span>
                  </div>
                )}
                {isCheckingBalance && blockchainInfoEnabled && (
                  <div className="flex items-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Checking balances...</span>
                  </div>
                )}
              </div>
              
              {/* Legacy Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('legacy')}</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">1...</span>
                    {formatBalance(bitcoinKey.balances.legacy) && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {formatBalance(bitcoinKey.balances.legacy)} BTC
                      </span>
                    )}
                  </div>
                  <CopyButton text={bitcoinKey.addresses.legacy} itemId={`${bitcoinKey.id}-legacy`} />
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded break-all leading-relaxed">
                  {bitcoinKey.addresses.legacy}
                </div>
              </div>
              
              {/* SegWit Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('segwit')}</span>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">3...</span>
                    {formatBalance(bitcoinKey.balances.segwit) && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {formatBalance(bitcoinKey.balances.segwit)} BTC
                      </span>
                    )}
                  </div>
                  <CopyButton text={bitcoinKey.addresses.segwit} itemId={`${bitcoinKey.id}-segwit`} />
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded break-all leading-relaxed">
                  {bitcoinKey.addresses.segwit}
                </div>
              </div>
              
              {/* Native SegWit Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('nativeSegwit')}</span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">bc1...</span>
                    {formatBalance(bitcoinKey.balances.nativeSegwit) && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {formatBalance(bitcoinKey.balances.nativeSegwit)} BTC
                      </span>
                    )}
                  </div>
                  <CopyButton text={bitcoinKey.addresses.nativeSegwit} itemId={`${bitcoinKey.id}-native`} />
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded break-all leading-relaxed">
                  {bitcoinKey.addresses.nativeSegwit}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalKeys: number;
  filteredKeys: number;
  searchLoading?: boolean;
}

export function SearchBar({ searchTerm, onSearchChange, totalKeys, filteredKeys, searchLoading }: SearchBarProps) {
  const { t } = useLanguage();
  
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 transition-colors">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {searchLoading ? (
            <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="break-words">
          {searchTerm
            ? searchLoading
              ? `${t('searchingThrough')} ${formatLargeNumber(totalKeys)} ${t('totalKeys')}...`
              : `${formatLargeNumber(filteredKeys)} ${t('keysFound')} "${searchTerm}"`
            : `${formatLargeNumber(totalKeys)} ${t('totalKeys')}`
          }
        </span>
        {searchTerm && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            {searchTerm.length < 3 && (
              <span className="text-orange-600 dark:text-orange-400 text-xs">
                {t('enterMinChars')}
              </span>
            )}
            <button
              onClick={() => onSearchChange('')}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium whitespace-nowrap"
            >
              {t('clearSearch')}
            </button>
          </div>
        )}
      </div>
      {searchTerm && filteredKeys > 0 && !searchLoading && (
        <div className="mt-2 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-green-700 dark:text-green-400 font-medium break-words">
                {t('foundInDatabase')} {formatLargeNumber(filteredKeys)} {t('foundInDatabase')}
              </span>
              <p className="text-green-600 dark:text-green-500 text-xs mt-1">
                {t('resultsInclude')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
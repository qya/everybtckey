import React, { useState } from 'react';
import { Bitcoin, Github, Info, Search, Shield, CheckCircle, Settings } from 'lucide-react';
import { useInfiniteKeys } from './hooks/useInfiniteKeys';
import { VirtualList } from './components/VirtualList';
import { SearchBar } from './components/SearchBar';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSelector } from './components/LanguageSelector';
import { SettingsModal } from './components/SettingsModal';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { blockchainInfoEnabled } = useSettings();
  
  const {
    keys,
    loading,
    loadMore,
    searchTerm,
    setSearchTerm,
    filteredKeys,
    hasMore,
    totalVirtualKeys,
    searchLoading,
    searchCompleted,
    checkKeyBalance,
  } = useInfiniteKeys();
  
  const { t } = useLanguage();
  
  // Create a wrapper function that respects the blockchain info setting
  const handleCheckBalance = async (key: any) => {
    if (!blockchainInfoEnabled) {
      console.log('Blockchain info is disabled in settings');
      return;
    }
    return checkKeyBalance(key);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>{t('educationalPurpose')}</span>
              </div>
              <ThemeToggle />
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t('settings')}
              >
                <Settings className="w-5 h-5" />
              </button>
              <a
                href="https://github.com/qya/everybtckey"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={t('viewSource')}
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>
      
      <main className="w-full px-2 mt-2">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalKeys={totalVirtualKeys}
          filteredKeys={filteredKeys.length}
          searchLoading={searchLoading}
        />
        
        <div className="mt-4">
          {/* Show different states based on search */}
          {!searchTerm ? (
            // Normal browsing mode
            <VirtualList
              keys={filteredKeys}
              loading={loading}
              loadMore={loadMore}
              hasMore={hasMore}
              totalVirtualKeys={totalVirtualKeys}
              onCheckBalance={handleCheckBalance}
            />
          ) : searchTerm.length < 3 ? (
            // Search term too short
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
              <div className="text-center py-16">
                <div className="text-gray-400 dark:text-gray-500 mb-6">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('startSearchTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                  {t('startSearchDesc')}
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-lg mx-auto">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">{t('searchTipsTitle')}</p>
                      <ul className="text-blue-700 dark:text-blue-400 text-sm mt-1 space-y-1">
                        <li>{t('searchTip1')}</li>
                        <li>{t('searchTip2')}</li>
                        <li>{t('searchTip3')}</li>
                        <li>{t('searchTip4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : searchLoading ? (
            // Searching state
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
              <div className="text-center py-16">
                <div className="text-orange-500 mb-6">
                  <Search className="w-16 h-16 mx-auto animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('searchingTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('searchingDesc')} "{searchTerm}"
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-orange-700 dark:text-orange-400 text-sm mt-2">{t('searchingWait')}</p>
                </div>
              </div>
            </div>
          ) : searchCompleted && filteredKeys.length === 0 ? (
            // No results found - good news! (only show after search is completed)
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
              <div className="text-center py-16">
                <div className="text-green-500 mb-6">
                  <Shield className="w-16 h-16 mx-auto" />
                </div>
                <div className="mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-3">
                    {t('noResultsTitle')}
                  </h3>
                </div>
                <div className="max-w-lg mx-auto space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    {t('noResultsDesc')}
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                      <div className="text-left">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">{t('safetyMeans')}</h4>
                        <ul className="text-green-700 dark:text-green-400 space-y-2">
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{t('safety1')}</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{t('safety2')}</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{t('safety3')}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {t('tryAnother')}
                  </button>
                </div>
              </div>
            </div>
          ) : filteredKeys.length > 0 ? (
            // Search results found
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                      {t('securityAlertTitle')}
                    </h4>
                    <p className="text-red-700 dark:text-red-400 text-sm">
                      {t('foundInDatabase')} <strong>{filteredKeys.length}</strong> {t('securityAlertDesc')}
                    </p>
                  </div>
                </div>
              </div>
              
              <VirtualList
                keys={filteredKeys}
                loading={false}
                loadMore={loadMore}
                hasMore={false}
                totalVirtualKeys={totalVirtualKeys}
                onCheckBalance={handleCheckBalance}
              />
            </div>
          ) : null}
        </div>
      </main>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;
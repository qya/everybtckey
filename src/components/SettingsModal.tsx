import React from 'react';
import { X, Globe, Shield, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Language } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português Brasil' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'български' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh-cn', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文' }
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const { blockchainInfoEnabled, setBlockchainInfoEnabled } = useSettings();

  if (!isOpen) return null;

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
  };

  const handleBlockchainToggle = () => {
    setBlockchainInfoEnabled(!blockchainInfoEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-colors mx-2 sm:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {t('settings')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Language Selection */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  {t('language')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 sm:max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`text-left p-2 sm:p-3 rounded-md transition-colors ${
                      language === lang.code
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-xs sm:text-sm">{lang.nativeName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Blockchain Info Toggle */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  {t('blockchainInfo')}
                </h3>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
                      {t('realtimeWalletInfo')}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
                      {t('realtimeWalletInfoDesc')}
                    </p>
                    
                    {!blockchainInfoEnabled && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 sm:p-3">
                        <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>{t('note')}:</strong> {t('balanceCheckDisabled')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleBlockchainToggle}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        blockchainInfoEnabled
                          ? 'bg-orange-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          blockchainInfoEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base"
              >
                {t('done')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
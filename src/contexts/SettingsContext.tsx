import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  blockchainInfoEnabled: boolean;
  setBlockchainInfoEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [blockchainInfoEnabled, setBlockchainInfoEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('blockchainInfoEnabled');
    return saved !== null ? JSON.parse(saved) : false; // Default to enabled
  });

  useEffect(() => {
    localStorage.setItem('blockchainInfoEnabled', JSON.stringify(blockchainInfoEnabled));
  }, [blockchainInfoEnabled]);

  const setBlockchainInfoEnabled = (enabled: boolean) => {
    setBlockchainInfoEnabledState(enabled);
  };

  return (
    <SettingsContext.Provider value={{ blockchainInfoEnabled, setBlockchainInfoEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
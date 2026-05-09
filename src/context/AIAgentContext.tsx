import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ConvMemory } from '../services/aiAgentService';

export type Lang = 'fr' | 'ar' | 'tn' | 'en' | 'it';

interface AIAgentContextType {
  isOpen: boolean;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  sendMessageToAgent: (message: string) => void;
  pendingMessage: string | null;
  clearPendingMessage: () => void;
  currentLanguage: Lang;
  setLanguage: (lang: Lang) => void;
  memory: ConvMemory;
  updateMemory: (update: Partial<ConvMemory>) => void;
}

const defaultMemory: ConvMemory = {
  clientName: null,
  lastProduct: null,
  lastWidth: null,
  lastHeight: null,
  lastQuantity: null,
  lastPrice: null,
  awaitingDimensions: false,
  awaitingProduct: false,
  awaitingPhone: false,
  mentionCount: 0,
};

const AIAgentContext = createContext<AIAgentContextType | null>(null);

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Lang>('fr');
  const [memory, setMemory] = useState<ConvMemory>(defaultMemory);

  const openAgent = useCallback(() => setIsOpen(true), []);
  const closeAgent = useCallback(() => setIsOpen(false), []);
  const toggleAgent = useCallback(() => setIsOpen(p => !p), []);

  const sendMessageToAgent = useCallback((message: string) => {
    setPendingMessage(message);
    setIsOpen(true);
  }, []);

  const clearPendingMessage = useCallback(() => setPendingMessage(null), []);

  const setLanguage = useCallback((lang: Lang) => setCurrentLanguage(lang), []);

  const updateMemory = useCallback((update: Partial<ConvMemory>) => {
    setMemory(prev => ({ ...prev, ...update }));
  }, []);

  return (
    <AIAgentContext.Provider
      value={{
        isOpen, openAgent, closeAgent, toggleAgent,
        sendMessageToAgent, pendingMessage, clearPendingMessage,
        currentLanguage, setLanguage,
        memory, updateMemory,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgentContext() {
  const ctx = useContext(AIAgentContext);
  if (!ctx) throw new Error('useAIAgentContext must be used inside AIAgentProvider');
  return ctx;
}

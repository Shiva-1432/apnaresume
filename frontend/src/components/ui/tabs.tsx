'use client';

import { ReactNode, createContext, useContext } from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: ReactNode;
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
}

interface TabsTriggerProps {
  value: string;
  activeValue?: string;
  onSelect?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs>.');
  }
  return context;
}

export function Tabs({ value, onValueChange, className = '', children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }: TabsListProps) {
  return <div className={`inline-grid gap-1 rounded-lg bg-neutral-100 p-1 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, activeValue, onSelect, className = '', children }: TabsTriggerProps) {
  const context = useTabsContext();
  const resolvedActiveValue = activeValue ?? context.value;
  const resolvedOnSelect = onSelect ?? context.onValueChange;
  const isActive = value === resolvedActiveValue;

  return (
    <button
      type="button"
      onClick={() => resolvedOnSelect(value)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children }: TabsContentProps) {
  const context = useTabsContext();

  if (value !== context.value) {
    return null;
  }
  return <div className={className}>{children}</div>;
}

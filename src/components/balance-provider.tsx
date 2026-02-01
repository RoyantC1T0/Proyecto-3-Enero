"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { balanceApi } from "@/lib/api-client";

interface BalanceData {
  current_month_income: number;
  current_month_expenses: number;
  current_month_balance: number;
  monthly_base_income: number;
  extra_income: number;
  total_savings: number;
  currency_code: string;
  conversions: {
    USD: { income: number; expenses: number; balance: number; savings: number };
    ARS: { income: number; expenses: number; balance: number; savings: number };
  };
  exchange_rate: {
    USD_to_ARS: number;
    updated_at: string;
  };
  last_updated: string;
}

interface BalanceContextType {
  balance: BalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setMonthlyIncome: (amount: number) => Promise<void>;
  closeBalance: () => Promise<{ success: boolean; summary?: object }>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await balanceApi.get();
      setBalance(data as BalanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const setMonthlyIncome = async (amount: number) => {
    await balanceApi.setMonthlyIncome(amount);
    await fetchBalance();
  };

  const closeBalance = async () => {
    try {
      const result = await balanceApi.closeBalance();
      await fetchBalance();
      return { success: true, summary: result.summary };
    } catch {
      return { success: false };
    }
  };

  return (
    <BalanceContext.Provider
      value={{
        balance,
        isLoading,
        error,
        refetch: fetchBalance,
        setMonthlyIncome,
        closeBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalanceContext must be used within a BalanceProvider");
  }
  return context;
}

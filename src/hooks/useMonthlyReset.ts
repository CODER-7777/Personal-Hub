import { useEffect } from 'react';
import { useAppStore } from '../store';
import { format } from 'date-fns';

export function useMonthlyReset() {
  const { expenses, lastResetMonth, setFinanceReports, clearExpenses, setLastResetMonth } = useAppStore();

  useEffect(() => {
    const currentMonth = format(new Date(), 'yyyy-MM'); // e.g., "2026-08"
    
    // If lastResetMonth doesn't exist, initialize it
    if (!lastResetMonth) {
      setLastResetMonth(currentMonth);
      return;
    }

    // If the month has changed!
    if (currentMonth !== lastResetMonth) {
      // 1. Compile the report
      const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      
      const newReport = {
        id: crypto.randomUUID(),
        month: lastResetMonth, // The month that just ended
        income: totalIncome,
        expense: totalExpense,
        rawTransactions: expenses // Keep the raw data if they want to view it later
      };

      // 2. Save to Zustand
      setFinanceReports(prev => [...prev, newReport]);
      
      // 3. Reset current expenses & update month
      clearExpenses();
      setLastResetMonth(currentMonth);
    }
  }, [expenses, lastResetMonth, clearExpenses, setFinanceReports, setLastResetMonth]); // Run when these change
}

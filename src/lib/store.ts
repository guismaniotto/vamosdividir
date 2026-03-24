import { useState, useCallback } from "react";

export interface Person {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  groupId: string;
  date: string;
  category: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: string[];
}

const PEOPLE: Person[] = [
  { id: "you", name: "Você", avatar: "🧑" },
];

const GROUPS: Group[] = [];

const EXPENSES: Expense[] = [];

export function useAppStore() {
  const [people] = useState<Person[]>(PEOPLE);
  const [groups, setGroups] = useState<Group[]>(GROUPS);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: crypto.randomUUID() }]);
  }, []);

  const getBalances = useCallback(() => {
    const balances: Record<string, Record<string, number>> = {};
    
    for (const expense of expenses) {
      const share = expense.amount / expense.splitBetween.length;
      for (const person of expense.splitBetween) {
        if (person !== expense.paidBy) {
          if (!balances[person]) balances[person] = {};
          if (!balances[expense.paidBy]) balances[expense.paidBy] = {};
          balances[person][expense.paidBy] = (balances[person][expense.paidBy] || 0) - share;
          balances[expense.paidBy][person] = (balances[expense.paidBy][person] || 0) + share;
        }
      }
    }
    return balances;
  }, [expenses]);

  const getTotalBalance = useCallback((personId: string) => {
    const balances = getBalances();
    const personBalances = balances[personId] || {};
    return Object.values(personBalances).reduce((sum, val) => sum + val, 0);
  }, [getBalances]);

  const getGroupExpenses = useCallback((groupId: string) => {
    return expenses.filter((e) => e.groupId === groupId);
  }, [expenses]);

  return { people, groups, expenses, addExpense, getBalances, getTotalBalance, getGroupExpenses, setGroups };
}

export const CATEGORIES = [
  { value: "alimentação", label: "🍔 Alimentação" },
  { value: "casa", label: "🏠 Casa" },
  { value: "transporte", label: "🚗 Transporte" },
  { value: "viagem", label: "✈️ Viagem" },
  { value: "entretenimento", label: "🎬 Entretenimento" },
  { value: "outro", label: "📦 Outro" },
];

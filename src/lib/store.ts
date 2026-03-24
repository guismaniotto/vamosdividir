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
  { id: "ana", name: "Ana", avatar: "👩" },
  { id: "carlos", name: "Carlos", avatar: "👨" },
  { id: "julia", name: "Júlia", avatar: "👩‍🦰" },
  { id: "marcos", name: "Marcos", avatar: "🧔" },
];

const GROUPS: Group[] = [
  { id: "house", name: "Casa", emoji: "🏠", members: ["you", "ana", "carlos"] },
  { id: "trip", name: "Viagem SP", emoji: "✈️", members: ["you", "julia", "marcos"] },
  { id: "dinner", name: "Jantares", emoji: "🍽️", members: ["you", "ana", "julia", "carlos"] },
];

const EXPENSES: Expense[] = [
  { id: "1", description: "Aluguel março", amount: 3000, paidBy: "you", splitBetween: ["you", "ana", "carlos"], groupId: "house", date: "2026-03-20", category: "casa" },
  { id: "2", description: "Supermercado", amount: 450, paidBy: "ana", splitBetween: ["you", "ana", "carlos"], groupId: "house", date: "2026-03-18", category: "alimentação" },
  { id: "3", description: "Hotel", amount: 1200, paidBy: "you", splitBetween: ["you", "julia", "marcos"], groupId: "trip", date: "2026-03-15", category: "viagem" },
  { id: "4", description: "Restaurante japonês", amount: 320, paidBy: "julia", splitBetween: ["you", "ana", "julia", "carlos"], groupId: "dinner", date: "2026-03-22", category: "alimentação" },
  { id: "5", description: "Uber para aeroporto", amount: 85, paidBy: "marcos", splitBetween: ["you", "julia", "marcos"], groupId: "trip", date: "2026-03-14", category: "transporte" },
  { id: "6", description: "Conta de luz", amount: 280, paidBy: "carlos", splitBetween: ["you", "ana", "carlos"], groupId: "house", date: "2026-03-10", category: "casa" },
  { id: "7", description: "Pizza sexta", amount: 120, paidBy: "you", splitBetween: ["you", "ana", "julia", "carlos"], groupId: "dinner", date: "2026-03-21", category: "alimentação" },
];

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

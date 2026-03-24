import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ExpenseItem } from "./ExpenseItem";
import type { Group, Expense, Person } from "@/lib/store";

interface GroupDetailProps {
  group: Group;
  expenses: Expense[];
  people: Person[];
  onBack: () => void;
}

export function GroupDetail({ group, expenses, people, onBack }: GroupDetailProps) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{group.emoji}</span>
        <div>
          <h2 className="text-xl font-bold text-foreground">{group.name}</h2>
          <p className="text-sm text-muted-foreground">
            {group.members.length} membros • Total: R$ {total.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma despesa neste grupo ainda.</p>
        ) : (
          expenses.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
            <ExpenseItem key={e.id} expense={e} people={people} />
          ))
        )}
      </div>
    </motion.div>
  );
}

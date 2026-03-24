import { motion } from "framer-motion";
import type { Group, Expense } from "@/lib/store";

interface GroupCardProps {
  group: Group;
  expenses: Expense[];
  onClick: () => void;
}

export function GroupCard({ group, expenses, onClick }: GroupCardProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{group.emoji}</span>
        <div>
          <h3 className="font-semibold text-card-foreground">{group.name}</h3>
          <p className="text-xs text-muted-foreground">{group.members.length} membros</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{expenses.length} despesas</span>
        <span className="font-medium text-card-foreground">R$ {total.toFixed(2)}</span>
      </div>
    </motion.button>
  );
}

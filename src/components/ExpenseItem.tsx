import { motion } from "framer-motion";
import type { Expense, Person } from "@/lib/store";

interface ExpenseItemProps {
  expense: Expense;
  people: Person[];
}

const categoryEmoji: Record<string, string> = {
  "alimentação": "🍔",
  "casa": "🏠",
  "transporte": "🚗",
  "viagem": "✈️",
  "entretenimento": "🎬",
  "outro": "📦",
};

export function ExpenseItem({ expense, people }: ExpenseItemProps) {
  const payer = people.find((p) => p.id === expense.paidBy);
  const isYou = expense.paidBy === "you";
  const yourShare = expense.splitBetween.includes("you")
    ? expense.amount / expense.splitBetween.length
    : 0;
  const youLent = isYou ? expense.amount - yourShare : 0;
  const youOwe = !isYou && yourShare > 0 ? yourShare : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
    >
      <span className="text-2xl">{categoryEmoji[expense.category] || "📦"}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-card-foreground truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground">
          {payer?.avatar} {payer?.name} pagou • {new Date(expense.date).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-card-foreground">R$ {expense.amount.toFixed(2)}</p>
        {youLent > 0 && (
          <p className="text-xs text-owed">você emprestou R$ {youLent.toFixed(2)}</p>
        )}
        {youOwe > 0 && (
          <p className="text-xs text-owe">você deve R$ {youOwe.toFixed(2)}</p>
        )}
      </div>
    </motion.div>
  );
}

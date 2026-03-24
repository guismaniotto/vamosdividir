import { motion } from "framer-motion";
import type { Person } from "@/lib/store";

interface BalanceCardProps {
  person: Person;
  balance: number;
}

export function BalanceCard({ person, balance }: BalanceCardProps) {
  const isPositive = balance > 0;
  const isZero = Math.abs(balance) < 0.01;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{person.avatar}</span>
        <span className="font-medium text-card-foreground">{person.name}</span>
      </div>
      <div className="text-right">
        {isZero ? (
          <span className="text-sm text-muted-foreground">tudo certo ✓</span>
        ) : (
          <>
            <p className={`font-semibold ${isPositive ? "text-owed" : "text-owe"}`}>
              R$ {Math.abs(balance).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPositive ? "te devem" : "você deve"}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

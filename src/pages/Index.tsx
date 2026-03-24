import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { BalanceCard } from "@/components/BalanceCard";
import { ExpenseItem } from "@/components/ExpenseItem";
import { GroupCard } from "@/components/GroupCard";
import { GroupDetail } from "@/components/GroupDetail";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { useAppStore } from "@/lib/store";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "dashboard" | "groups" | "activity" | "balances";

const Index = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const store = useAppStore();

  const totalBalance = store.getTotalBalance("you");
  const balances = store.getBalances();
  const youBalances = balances["you"] || {};

  const otherPeople = store.people.filter((p) => p.id !== "you");

  const selectedGroup = store.groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-bold text-foreground">💸 DivideAí</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Balance summary */}
              <div className="rounded-xl bg-primary p-6 text-primary-foreground">
                <p className="text-sm opacity-80">Saldo total</p>
                <div className="flex items-center gap-2 mt-1">
                  {totalBalance >= 0 ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                  <span className="text-3xl font-bold">
                    R$ {Math.abs(totalBalance).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm mt-1 opacity-80">
                  {totalBalance >= 0 ? "te devem no total" : "você deve no total"}
                </p>
              </div>

              {/* Recent expenses */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Despesas recentes
                </h2>
                <div className="space-y-2">
                  {store.expenses
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map((e) => (
                      <ExpenseItem key={e.id} expense={e} people={store.people} />
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selectedGroup ? (
                <GroupDetail
                  group={selectedGroup}
                  expenses={store.getGroupExpenses(selectedGroup.id)}
                  people={store.people}
                  onBack={() => setSelectedGroupId(null)}
                />
              ) : (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Seus grupos
                  </h2>
                  {store.groups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      expenses={store.getGroupExpenses(g.id)}
                      onClick={() => setSelectedGroupId(g.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Todas as despesas
              </h2>
              {store.expenses
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <ExpenseItem key={e.id} expense={e} people={store.people} />
                ))}
            </motion.div>
          )}

          {tab === "balances" && (
            <motion.div key="balances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Saldo com cada pessoa
              </h2>
              {otherPeople.map((p) => (
                <BalanceCard
                  key={p.id}
                  person={p}
                  balance={youBalances[p.id] || 0}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddExpenseDialog people={store.people} groups={store.groups} onAdd={store.addExpense} />
      <BottomNav active={tab} onChange={(t) => { setTab(t); setSelectedGroupId(null); }} />
    </div>
  );
};

export default Index;

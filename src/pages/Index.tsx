import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { GroupCard } from "@/components/GroupCard";
import { GroupDetail } from "@/components/GroupDetail";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "dashboard" | "groups" | "activity" | "balances";

const Index = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*, group_members(user_id, profiles:user_id(display_name, avatar_url))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch expenses for user's groups
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_splits(user_id, amount), profiles:paid_by(display_name)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate total balance
  const totalBalance = expenses.reduce((sum, expense) => {
    if (expense.paid_by === user?.id) {
      // I paid - others owe me
      const mySplits = expense.expense_splits?.filter((s: any) => s.user_id !== user?.id) || [];
      return sum + mySplits.reduce((s: number, split: any) => s + Number(split.amount), 0);
    } else {
      // Someone else paid - I might owe them
      const mySplit = expense.expense_splits?.find((s: any) => s.user_id === user?.id);
      return sum - (mySplit ? Number(mySplit.amount) : 0);
    }
  }, 0);

  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  const groupExpenses = (groupId: string) =>
    expenses.filter((e: any) => e.group_id === groupId);

  // Build people list from group members for AddExpenseDialog
  const allMembers = groups.flatMap((g: any) =>
    (g.group_members || []).map((m: any) => ({
      id: m.user_id,
      name: m.profiles?.display_name || "Sem nome",
      avatar: m.profiles?.avatar_url ? "👤" : "🧑",
    }))
  );
  const uniquePeople = Array.from(
    new Map(allMembers.map((p: any) => [p.id, p])).values()
  );

  const storeGroups = groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    members: (g.group_members || []).map((m: any) => m.user_id),
  }));

  const handleAddExpense = async (expense: any) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paidBy,
        group_id: expense.groupId,
        category: expense.category,
        date: expense.date,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // Create splits
    const splitAmount = expense.amount / expense.splitBetween.length;
    const splits = expense.splitBetween.map((userId: string) => ({
      expense_id: data.id,
      user_id: userId,
      amount: splitAmount,
    }));

    await supabase.from("expense_splits").insert(splits);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">💸 DivideAí</h1>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
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

              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Despesas recentes
                </h2>
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{e.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.profiles?.display_name || "Alguém"} pagou • {e.date}
                        </p>
                      </div>
                      <span className="font-bold text-foreground">
                        R$ {Number(e.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma despesa ainda. Crie um grupo para começar!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selectedGroup ? (
                <GroupDetail
                  group={{
                    id: selectedGroup.id,
                    name: selectedGroup.name,
                    emoji: selectedGroup.emoji,
                    members: (selectedGroup.group_members || []).map((m: any) => m.user_id),
                  }}
                  expenses={groupExpenses(selectedGroup.id).map((e: any) => ({
                    id: e.id,
                    description: e.description,
                    amount: Number(e.amount),
                    paidBy: e.paid_by,
                    splitBetween: (e.expense_splits || []).map((s: any) => s.user_id),
                    groupId: e.group_id,
                    date: e.date,
                    category: e.category,
                  }))}
                  people={uniquePeople}
                  onBack={() => setSelectedGroupId(null)}
                />
              ) : (
                <div className="space-y-3">
                  <CreateGroupDialog onCreated={refreshData} />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-4">
                    Seus grupos
                  </h2>
                  {groups.map((g: any) => (
                    <GroupCard
                      key={g.id}
                      group={{
                        id: g.id,
                        name: g.name,
                        emoji: g.emoji,
                        members: (g.group_members || []).map((m: any) => m.user_id),
                      }}
                      expenses={groupExpenses(g.id).map((e: any) => ({
                        id: e.id,
                        description: e.description,
                        amount: Number(e.amount),
                        paidBy: e.paid_by,
                        splitBetween: [],
                        groupId: e.group_id,
                        date: e.date,
                        category: e.category,
                      }))}
                      onClick={() => setSelectedGroupId(g.id)}
                    />
                  ))}
                  {groups.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Você ainda não tem grupos. Crie um acima!
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Todas as despesas
              </h2>
              {expenses.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.profiles?.display_name || "Alguém"} pagou • {e.date}
                    </p>
                  </div>
                  <span className="font-bold text-foreground">
                    R$ {Number(e.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma despesa registrada.
                </p>
              )}
            </motion.div>
          )}

          {tab === "balances" && (
            <motion.div key="balances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Saldo com cada pessoa
              </h2>
              {uniquePeople
                .filter((p: any) => p.id !== user?.id)
                .map((p: any) => {
                  const balance = expenses.reduce((sum: number, expense: any) => {
                    if (expense.paid_by === user?.id) {
                      const theirSplit = expense.expense_splits?.find(
                        (s: any) => s.user_id === p.id
                      );
                      return sum + (theirSplit ? Number(theirSplit.amount) : 0);
                    } else if (expense.paid_by === p.id) {
                      const mySplit = expense.expense_splits?.find(
                        (s: any) => s.user_id === user?.id
                      );
                      return sum - (mySplit ? Number(mySplit.amount) : 0);
                    }
                    return sum;
                  }, 0);

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                      <span
                        className={`font-bold ${
                          balance > 0
                            ? "text-[hsl(var(--owed))]"
                            : balance < 0
                            ? "text-[hsl(var(--owe))]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {balance > 0 ? "+" : ""}R$ {Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              {uniquePeople.filter((p: any) => p.id !== user?.id).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Adicione pessoas aos seus grupos para ver os saldos.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {storeGroups.length > 0 && (
        <AddExpenseDialog
          people={uniquePeople}
          groups={storeGroups}
          onAdd={handleAddExpense}
        />
      )}
      <BottomNav active={tab} onChange={(t) => { setTab(t); setSelectedGroupId(null); }} />
    </div>
  );
};

export default Index;

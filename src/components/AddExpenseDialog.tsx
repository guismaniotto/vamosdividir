import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import type { Person, Group } from "@/lib/store";
import { CATEGORIES } from "@/lib/store";

interface AddExpenseDialogProps {
  people: Person[];
  groups: Group[];
  onAdd: (expense: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    groupId: string;
    date: string;
    category: string;
  }) => void;
}

export function AddExpenseDialog({ people, groups, onAdd }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("you");
  const [groupId, setGroupId] = useState(groups[0]?.id || "");
  const [category, setCategory] = useState("outro");
  const [splitBetween, setSplitBetween] = useState<string[]>([]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  const handleGroupChange = (gid: string) => {
    setGroupId(gid);
    const g = groups.find((gr) => gr.id === gid);
    if (g) setSplitBetween(g.members);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || splitBetween.length === 0) return;
    onAdd({
      description,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
      groupId,
      date: new Date().toISOString().split("T")[0],
      category,
    });
    setDescription("");
    setAmount("");
    setPaidBy("you");
    setCategory("outro");
    setOpen(false);
  };

  const toggleSplit = (id: string) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && selectedGroup) setSplitBetween(selectedGroup.members); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 w-14 p-0">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pago por</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.avatar} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grupo</Label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.emoji} {g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dividir entre</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedGroup?.members.map((mId) => {
                const person = people.find((p) => p.id === mId);
                if (!person) return null;
                return (
                  <label key={mId} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-secondary transition-colors">
                    <Checkbox checked={splitBetween.includes(mId)} onCheckedChange={() => toggleSplit(mId)} />
                    <span className="text-sm">{person.avatar} {person.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <Button type="submit" className="w-full">Adicionar despesa</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

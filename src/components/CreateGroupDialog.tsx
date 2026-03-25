import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const EMOJIS = ["👥", "🏠", "✈️", "🍔", "🎬", "🎓", "💼", "🎉", "⚽", "🛒"];

interface CreateGroupDialogProps {
  onCreated: () => void;
}

export function CreateGroupDialog({ onCreated }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [memberEmails, setMemberEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const addEmailField = () => setMemberEmails((prev) => [...prev, ""]);

  const removeEmailField = (index: number) => {
    setMemberEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    setMemberEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ name: name.trim(), emoji, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id });

      // Find and add other members by email
      const validEmails = memberEmails.filter((e) => e.trim());
      for (const email of validEmails) {
        // Look up user by email in profiles (we can't query auth.users directly)
        // For now, we'll show a message that they need to sign up first
        toast.info(`Convite para ${email}: a pessoa precisa criar conta primeiro para ser adicionada.`);
      }

      toast.success(`Grupo "${name}" criado!`);
      setName("");
      setEmoji("👥");
      setMemberEmails([""]);
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Criar novo grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do grupo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento, Viagem SP"
              required
            />
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    emoji === e
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar membros (email)
            </Label>
            <div className="space-y-2 mt-2">
              {memberEmails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                  {memberEmails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmailField(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailField}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar outro
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar grupo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

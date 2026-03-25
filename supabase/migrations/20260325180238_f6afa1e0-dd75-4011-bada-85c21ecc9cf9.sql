-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '👥',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups: members can see their groups
CREATE POLICY "Members can view their groups" ON public.groups FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = id AND group_members.user_id = auth.uid()));

CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update group" ON public.groups FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete group" ON public.groups FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));

CREATE POLICY "Group creator can add members" ON public.group_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_id AND groups.created_by = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Group creator can remove members" ON public.group_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_id AND groups.created_by = auth.uid()));

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'outro',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group expenses" ON public.expenses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = expenses.group_id AND group_members.user_id = auth.uid()));

CREATE POLICY "Members can add expenses" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = expenses.group_id AND group_members.user_id = auth.uid()) AND auth.uid() = paid_by);

CREATE POLICY "Creator can delete expense" ON public.expenses FOR DELETE TO authenticated
USING (auth.uid() = paid_by);

-- Expense splits table
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  UNIQUE(expense_id, user_id)
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view splits" ON public.expense_splits FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.expenses e JOIN public.group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_splits.expense_id AND gm.user_id = auth.uid()));

CREATE POLICY "Members can add splits" ON public.expense_splits FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.expenses e JOIN public.group_members gm ON gm.group_id = e.group_id WHERE e.id = expense_splits.expense_id AND gm.user_id = auth.uid()));
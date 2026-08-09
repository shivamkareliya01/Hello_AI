CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  team_role TEXT,
  summary_style TEXT NOT NULL DEFAULT 'concise',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled meeting',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'uploaded',
  audio_path TEXT,
  duration_seconds NUMERIC,
  transcript TEXT,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB,
  error_message TEXT,
  share_token TEXT UNIQUE,
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT SELECT ON public.meetings TO anon;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meetings" ON public.meetings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shared meetings readable" ON public.meetings FOR SELECT TO anon, authenticated USING (share_token IS NOT NULL);
CREATE INDEX meetings_user_created_idx ON public.meetings (user_id, created_at DESC);

CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  task TEXT NOT NULL,
  owner TEXT,
  due_date TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items TO authenticated;
GRANT SELECT ON public.action_items TO anon;
GRANT ALL ON public.action_items TO service_role;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own action items" ON public.action_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shared action items readable" ON public.action_items FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.share_token IS NOT NULL));
CREATE INDEX action_items_meeting_idx ON public.action_items (meeting_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER meetings_touch BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
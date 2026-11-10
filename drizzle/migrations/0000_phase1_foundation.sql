CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  birth_year int,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Community',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags readable" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "users create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND category = 'Community');

CREATE TABLE public.user_tags (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tags TO authenticated;
GRANT ALL ON public.user_tags TO service_role;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own or public tags" ON public.user_tags FOR SELECT TO authenticated USING (is_public OR auth.uid() = user_id);
CREATE POLICY "manage own tags ins" ON public.user_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "manage own tags upd" ON public.user_tags FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "manage own tags del" ON public.user_tags FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tag_counts() RETURNS TABLE(tag_id uuid, followers bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tag_id, count(*) FROM public.user_tags GROUP BY tag_id
$$;
GRANT EXECUTE ON FUNCTION public.tag_counts() TO authenticated;

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  storage_path text NOT NULL,
  filter text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own media sel" ON public.media FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own media ins" ON public.media FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own media del" ON public.media FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "gallery own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "gallery own write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "gallery own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.tags (slug, name, category) VALUES
('programming','Programming','Technology'),('ai','Artificial Intelligence','Technology'),('web-dev','Web Development','Technology'),('cybersecurity','Cybersecurity','Technology'),('hackathons','Hackathons','Technology'),
('anime','Anime','Entertainment'),('gaming','Gaming','Entertainment'),('music','Music','Entertainment'),('movies','Movies','Entertainment'),('photography','Photography','Entertainment'),
('college','College Communities','Education'),('university','University Groups','Education'),('school','School Communities','Education'),('cp','Competitive Programming','Education'),
('fitness','Fitness','Lifestyle'),('travel','Travel','Lifestyle'),('art','Art','Lifestyle'),('books','Books','Lifestyle'),('fashion','Fashion','Lifestyle'),
('hindi','Hindi','Indian Communities'),('bengali','Bengali','Indian Communities'),('tamil','Tamil','Indian Communities'),('telugu','Telugu','Indian Communities'),('punjabi','Punjabi','Indian Communities'),('marathi','Marathi','Indian Communities'),('malayalam','Malayalam','Indian Communities'),('kannada','Kannada','Indian Communities'),('gujarati','Gujarati','Indian Communities'),('assamese','Assamese','Indian Communities'),('odia','Odia','Indian Communities');
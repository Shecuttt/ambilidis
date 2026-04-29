-- 1. Beri izin user untuk insert toko mereka sendiri (Tadinya kita lupa menambahkan ini di schema awal)
CREATE POLICY "Users can insert own store." ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 2. Trigger otomatis untuk membuat 'profile' setiap ada user baru mendaftar (Best Practice Supabase)
-- Ini diperlukan karena tabel 'stores' mewajibkan owner_id ada di tabel 'profiles' (Foreign Key)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama jika ada, lalu buat baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

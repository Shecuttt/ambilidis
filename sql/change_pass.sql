-- Trigger untuk reset agreed_at saat user ganti password
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika password berubah, set agreed_at jadi NULL di tabel profiles
  IF NEW.encrypted_password <> OLD.encrypted_password THEN
    UPDATE public.profiles
    SET agreed_at = NULL
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_password_change();

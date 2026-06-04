


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "ref";


ALTER SCHEMA "ref" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_slug"("store_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  s TEXT;
BEGIN
  s := lower(store_name);

  -- remove special characters except alnum, space, dash
  s := regexp_replace(s, '[^a-z0-9\s-]', '', 'g');

  -- collapse whitespace to single dash
  s := regexp_replace(s, '\s+', '-', 'g');

  -- collapse multiple dashes
  s := regexp_replace(s, '-+', '-', 'g');

  -- trim leading/trailing dashes
  s := regexp_replace(s, '^-|-$', '', 'g');

  -- remove any remaining non alnum/dash (safety pass)
  s := regexp_replace(s, '[^a-z0-9-]', '', 'g');

  -- final collapse just in case
  s := regexp_replace(s, '--+', '-', 'g');

  RETURN s;
END;
$_$;


ALTER FUNCTION "public"."generate_slug"("store_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_store_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.slug = generate_slug(NEW.name) || '-' || substr(md5(NEW.id::text), 1, 8);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_store_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'seller'
        THEN ARRAY['seller', 'buyer']::text[]
      ELSE ARRAY['buyer']::text[]
    END
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_status_logs (order_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_role_sanitize"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role IS NULL OR cardinality(NEW.role) = 0 THEN
    NEW.role := ARRAY['buyer']::text[];
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."profiles_role_sanitize"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_store_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.slug = generate_slug(NEW.name) || '-' || substr(md5(NEW.id::text), 1, 8);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_store_slug"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "text",
    "note" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "deliveries_status_check" CHECK (("status" = ANY (ARRAY['waiting_pickup'::"text", 'on_the_way'::"text", 'delivered'::"text"])))
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_status_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "total_price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "platform_fee" numeric DEFAULT 0,
    "delivery_fee" numeric DEFAULT 0,
    "buyer_note" "text",
    "payment_token" "text",
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "payment_method" "text" DEFAULT 'transfer'::"text",
    "rejection_reason" "text",
    "shipping_address" "text",
    "buyer_name" "text",
    "buyer_phone" "text",
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'in_delivery'::"text", 'completed'::"text", 'canceled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "photo_url" "text",
    "price" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "address" "text",
    "location" "extensions"."geography"(Point,4326),
    "role" "text"[] DEFAULT ARRAY['buyer'::"text"] NOT NULL,
    "agreed_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "profiles_role_not_empty" CHECK (("cardinality"("role") > 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."agreed_at" IS 'Menyimpan waktu kapan user menyetujui syarat & ketentuan (T&C).';



CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "complaints" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "photo_url" "text",
    "address" "text",
    "is_open" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tagline_today" "text",
    "operating_hours" "jsonb",
    "latitude" numeric,
    "longitude" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "logo_url" "text",
    "banner_url" "text",
    "slug" "text",
    "location" "extensions"."geography"(Point,4326)
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



CREATE INDEX "order_status_logs_order_id_idx" ON "public"."order_status_logs" USING "btree" ("order_id");



CREATE INDEX "profiles_location_idx" ON "public"."profiles" USING "gist" ("location");



CREATE INDEX "stores_location_idx" ON "public"."stores" USING "gist" ("location");



CREATE UNIQUE INDEX "stores_slug_idx" ON "public"."stores" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "store_slug_trigger" BEFORE INSERT ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."generate_store_slug"();



CREATE OR REPLACE TRIGGER "store_slug_update_trigger" BEFORE UPDATE ON "public"."stores" FOR EACH ROW WHEN (("old"."name" IS DISTINCT FROM "new"."name")) EXECUTE FUNCTION "public"."update_store_slug"();



CREATE OR REPLACE TRIGGER "trg_log_order_status_change" AFTER INSERT OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."log_order_status_change"();



CREATE OR REPLACE TRIGGER "trg_profiles_role_sanitize" BEFORE INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_role_sanitize"();



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Anyone can read ratings" ON "public"."ratings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Buyer can delete own rating" ON "public"."ratings" FOR DELETE TO "authenticated" USING (("buyer_id" = "auth"."uid"()));



CREATE POLICY "Buyer can insert own rating" ON "public"."ratings" FOR INSERT TO "authenticated" WITH CHECK (("buyer_id" = "auth"."uid"()));



CREATE POLICY "Buyer can update own rating" ON "public"."ratings" FOR UPDATE TO "authenticated" USING (("buyer_id" = "auth"."uid"())) WITH CHECK (("buyer_id" = "auth"."uid"()));



CREATE POLICY "Buyers can insert order items." ON "public"."order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."buyer_id" = "auth"."uid"())))));



CREATE POLICY "Buyers can insert orders." ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can update their own orders." ON "public"."orders" FOR UPDATE USING (("auth"."uid"() = "buyer_id")) WITH CHECK ((("auth"."uid"() = "buyer_id") AND ("status" = ANY (ARRAY['completed'::"text", 'canceled'::"text"]))));



CREATE POLICY "Open stores are viewable by everyone." ON "public"."stores" FOR SELECT USING (("is_open" = true));



CREATE POLICY "Public products are viewable by everyone." ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Sellers can create stores." ON "public"."stores" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Sellers can insert a store." ON "public"."stores" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Sellers can manage their own products" ON "public"."products" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."stores"
  WHERE (("stores"."id" = "products"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))) AND ('{seller}'::"text"[] IN ( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Sellers can manage their own store" ON "public"."stores" TO "authenticated" USING ((("auth"."uid"() = "owner_id") AND ('{seller}'::"text"[] IN ( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Sellers can update orders." ON "public"."orders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."stores"
  WHERE (("stores"."id" = "orders"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Sellers can view their own stores." ON "public"."stores" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete their own store." ON "public"."stores" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert own store." ON "public"."stores" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own store." ON "public"."stores" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can manage their store's products." ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."stores"
  WHERE (("stores"."id" = "products"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can read order items of their orders." ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."stores"
          WHERE (("stores"."id" = "orders"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can read their deliveries." ON "public"."deliveries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "deliveries"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."stores"
          WHERE (("stores"."id" = "orders"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can read their own orders." ON "public"."orders" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR (EXISTS ( SELECT 1
   FROM "public"."stores"
  WHERE (("stores"."id" = "orders"."store_id") AND ("stores"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view logs of their own orders" ON "public"."order_status_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_status_logs"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."stores"
          WHERE (("stores"."id" = "orders"."store_id") AND ("stores"."owner_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deliveries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."generate_slug"("store_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("store_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("store_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_store_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_store_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_store_slug"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_role_sanitize"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_role_sanitize"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_role_sanitize"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_store_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_store_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_store_slug"() TO "service_role";

















































































GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_logs" TO "anon";
GRANT ALL ON TABLE "public"."order_status_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_logs" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




































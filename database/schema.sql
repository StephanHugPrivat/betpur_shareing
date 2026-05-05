-- Profiles table (erweitert auth.users)
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name text NOT NULL,
    wohnung text,
    status text DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'active',
            'inactive'
        )
    ),
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now ()
);

-- RLS für profiles aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Items table
CREATE TABLE items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    owner_id uuid REFERENCES profiles (id) ON DELETE CASCADE,
    titel text NOT NULL,
    beschreibung text,
    foto_url text,
    kategorie text NOT NULL CHECK (
        kategorie IN (
            'werkzeug',
            'haushalt',
            'garten',
            'sport',
            'elektronik',
            'sonstiges'
        )
    ),
    standort text,
    status text DEFAULT 'verfuegbar' CHECK (
        status IN (
            'verfuegbar',
            'ausgeliehen',
            'inaktiv'
        )
    ),
    created_at timestamptz DEFAULT now ()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Loan requests table (Ausleihanfragen)
CREATE TABLE loan_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    item_id uuid REFERENCES items (id) ON DELETE CASCADE,
    requester_id uuid REFERENCES profiles (id) ON DELETE CASCADE,
    nachricht text,
    status text DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'accepted',
            'declined'
        )
    ),
    owner_antwort text,
    created_at timestamptz DEFAULT now (),
    updated_at timestamptz DEFAULT now ()
);

ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;

-- Push subscriptions table
CREATE TABLE push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id uuid REFERENCES profiles (id) ON DELETE CASCADE,
    subscription jsonb NOT NULL,
    created_at timestamptz DEFAULT now ()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Function to handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, wohnung)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'wohnung', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger run after user is created in Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Setup Storage Bucket for item photos
INSERT INTO
    storage.buckets (id, name, public)
VALUES ('items', 'items', true);

-- *** ROW LEVEL SECURITY POLICIES ***

-- Profiles: everyone can view
CREATE POLICY "Profiles viewable by anyone" ON profiles FOR
SELECT USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid () = id);

-- Profiles: Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON profiles FOR
UPDATE USING (
    (
        SELECT is_admin
        FROM profiles
        WHERE
            id = auth.uid ()
    ) = true
);

-- Items: everyone can view
CREATE POLICY "Items viewable by everyone" ON items FOR
SELECT USING (true);

-- Items: Users can insert their own items
CREATE POLICY "Users can insert own items" ON items FOR INSERT
WITH
    CHECK (auth.uid () = owner_id);

-- Items: Users can update their own items
CREATE POLICY "Users can update own items" ON items FOR
UPDATE USING (auth.uid () = owner_id);

-- Items: Users can delete their own items (optional, requirement says deactivate)
-- CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid() = owner_id);

-- Loan_requests: requester or item owner can view
CREATE POLICY "Users view relevant requests" ON loan_requests FOR
SELECT USING (
        auth.uid () = requester_id
        OR auth.uid () IN (
            SELECT owner_id
            FROM items
            WHERE
                id = item_id
        )
    );

-- Loan_requests: requester can insert
CREATE POLICY "Users can insert requests" ON loan_requests FOR INSERT
WITH
    CHECK (auth.uid () = requester_id);

-- Loan_requests: item owner can update (accept/decline), requester can update if still pending
CREATE POLICY "Parties can update request" ON loan_requests FOR
UPDATE USING (
    auth.uid () IN (
        SELECT owner_id
        FROM items
        WHERE
            id = item_id
    )
    OR (
        auth.uid () = requester_id
        AND status = 'pending'
    )
);

-- Storage policies: anyone can view item pictures
CREATE POLICY "Item images public access" ON storage.objects FOR
SELECT USING (bucket_id = 'items');

-- Storage policies: authenticated users can upload pictures
CREATE POLICY "Users can upload item images" ON storage.objects FOR INSERT TO authenticated
WITH
    CHECK (bucket_id = 'items');

CREATE POLICY "Users can update item images" ON storage.objects FOR
UPDATE TO authenticated USING (bucket_id = 'items');

CREATE POLICY "Users can delete item images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'items');
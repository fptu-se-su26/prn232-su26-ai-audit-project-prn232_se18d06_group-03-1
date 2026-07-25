ALTER TABLE "Promotions" ADD COLUMN IF NOT EXISTS created_by_role text NOT NULL DEFAULT 'Admin';

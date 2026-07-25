ALTER TABLE "Promotions" ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Approved';

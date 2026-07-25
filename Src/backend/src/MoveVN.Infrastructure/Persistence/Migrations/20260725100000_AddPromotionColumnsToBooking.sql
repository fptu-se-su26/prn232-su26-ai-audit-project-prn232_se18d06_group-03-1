ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS promotion_id bigint;
ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS promotion_code text;
ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS promotion_discount numeric(15,2) NOT NULL DEFAULT 0;

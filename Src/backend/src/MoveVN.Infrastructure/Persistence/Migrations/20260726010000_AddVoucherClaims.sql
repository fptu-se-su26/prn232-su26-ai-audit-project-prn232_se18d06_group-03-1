CREATE TABLE IF NOT EXISTS voucher_claims (
    id bigserial PRIMARY KEY,
    customer_id bigint NOT NULL,
    promotion_id bigint NOT NULL,
    claimed_at timestamptz NOT NULL DEFAULT (now()),
    used_at timestamptz NULL,
    booking_id bigint NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_voucher_claims_customer_promotion ON voucher_claims (customer_id, promotion_id);
CREATE INDEX IF NOT EXISTS ix_voucher_claims_customer_id ON voucher_claims (customer_id);
CREATE INDEX IF NOT EXISTS ix_voucher_claims_promotion_id ON voucher_claims (promotion_id);

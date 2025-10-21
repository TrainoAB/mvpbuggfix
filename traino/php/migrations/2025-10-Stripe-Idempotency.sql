-- Stripe minimal hardening migration
-- Adds uniqueness constraints for idempotency and an idempotency_key column for transactions.

START TRANSACTION;

-- Ensure unique booking per payment_intent_id
ALTER TABLE pass_booked
  ADD UNIQUE INDEX IF NOT EXISTS idx_pass_booked_payment_intent_id (payment_intent_id);

-- Ensure unique transaction per payment_intent_id
ALTER TABLE transactions
  ADD UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_intent_id (payment_intent_id);

-- Add idempotency_key column for transactions (allows multiple NULLs, unique non-null)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) NULL;

-- Unique index on idempotency_key
ALTER TABLE transactions
  ADD UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key (idempotency_key);

COMMIT;
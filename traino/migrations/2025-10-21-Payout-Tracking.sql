-- =====================================================
-- Traino Payment Model Migration
-- Date: 2025-10-21
-- Purpose: Add payout tracking to support new payment flow
--          100% of funds stay in Traino account, manual trainer payouts
-- =====================================================

-- This migration adds columns to track the 85/15 split and payout status
-- Compatible with MySQL 5.7+ and MariaDB 10.2+


-- =====================================================
-- STEP 1: Add payout tracking columns to transactions table
-- =====================================================

-- Add gross_amount column (full amount paid by customer in öre/cents)
ALTER TABLE transactions 
ADD COLUMN gross_amount INT NULL COMMENT 'Full amount paid by customer in öre (100 öre = 1 SEK)' 
AFTER price;

-- Add trainer_amount column (85% owed to trainer)
ALTER TABLE transactions 
ADD COLUMN trainer_amount INT NULL COMMENT '85% of gross amount owed to trainer in öre' 
AFTER gross_amount;

-- Add platform_fee column (15% kept by platform)
ALTER TABLE transactions 
ADD COLUMN platform_fee INT NULL COMMENT '15% platform fee in öre' 
AFTER trainer_amount;

-- Add payout_status column (tracks payout lifecycle)
ALTER TABLE transactions 
ADD COLUMN payout_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' 
COMMENT 'Status of trainer payout: pending=awaiting payout, processing=transfer initiated, completed=trainer paid, failed=transfer failed' 
AFTER platform_fee;

-- Add stripe_transfer_id column (reference to Stripe Transfer object)
ALTER TABLE transactions 
ADD COLUMN stripe_transfer_id VARCHAR(255) NULL 
COMMENT 'Stripe Transfer ID when funds are paid out to trainer' 
AFTER payout_status;

-- Add payout_date column (timestamp when trainer was paid)
ALTER TABLE transactions 
ADD COLUMN payout_date DATETIME NULL 
COMMENT 'Date and time when trainer payout was completed' 
AFTER stripe_transfer_id;

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

-- Index for querying pending payouts by trainer
CREATE INDEX idx_payout_status_trainer 
ON transactions(payout_status, trainer_id, status);

-- Index for looking up transactions by Stripe Transfer ID
CREATE INDEX idx_stripe_transfer 
ON transactions(stripe_transfer_id);

-- Index for payout date queries (reporting)
CREATE INDEX idx_payout_date 
ON transactions(payout_date);

-- =====================================================
-- STEP 3: Backfill existing transactions (OPTIONAL)
-- =====================================================
-- This section calculates splits for existing transactions
-- Uncomment if you want to retroactively calculate trainer payouts

/*
UPDATE transactions 
SET 
  gross_amount = price,
  trainer_amount = ROUND(price * 0.85),
  platform_fee = ROUND(price * 0.15),
  payout_status = CASE 
    WHEN status = 'completed' THEN 'pending'
    ELSE 'pending'
  END
WHERE gross_amount IS NULL 
  AND price IS NOT NULL
  AND price > 0;
*/

-- =====================================================
-- STEP 4: Add validation constraint (OPTIONAL)
-- =====================================================
-- Ensures that gross_amount = trainer_amount + platform_fee
-- Uncomment to add validation (requires MySQL 8.0.16+ or MariaDB 10.2.1+)

/*
ALTER TABLE transactions 
ADD CONSTRAINT chk_amount_split 
CHECK (
  gross_amount IS NULL 
  OR (gross_amount = trainer_amount + platform_fee)
);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify changes

-- Check new columns exist
-- SHOW COLUMNS FROM transactions LIKE '%amount%';
-- SHOW COLUMNS FROM transactions LIKE '%payout%';

-- Check indexes were created
-- SHOW INDEXES FROM transactions WHERE Key_name LIKE 'idx_payout%' OR Key_name LIKE 'idx_stripe_transfer';

-- Count transactions by payout status
-- SELECT payout_status, COUNT(*) as count, SUM(trainer_amount) as total_owed 
-- FROM transactions 
-- GROUP BY payout_status;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
/*
-- WARNING: This will delete payout tracking data permanently!

DROP INDEX idx_payout_status_trainer ON transactions;
DROP INDEX idx_stripe_transfer ON transactions;
DROP INDEX idx_payout_date ON transactions;

ALTER TABLE transactions DROP COLUMN payout_date;
ALTER TABLE transactions DROP COLUMN stripe_transfer_id;
ALTER TABLE transactions DROP COLUMN payout_status;
ALTER TABLE transactions DROP COLUMN platform_fee;
ALTER TABLE transactions DROP COLUMN trainer_amount;
ALTER TABLE transactions DROP COLUMN gross_amount;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Deploy updated code that populates these fields
-- 2. Monitor first few transactions to ensure splits calculate correctly
-- 3. Build payout processing interface when ready
-- =====================================================

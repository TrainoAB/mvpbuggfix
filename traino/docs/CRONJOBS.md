# Cron Jobs & Scheduled Tasks

This document lists all scheduled PHP cron jobs in Traino, including their purpose, frequency, and configuration.

---

## Overview

Traino uses **system cron jobs** (via crontab) to execute scheduled PHP scripts for:

- **Daily cleanup** (expired schedules, session duplicates)
- **Payment verification** (pending PaymentIntents)
- **Monthly payouts** (Stripe Transfers to trainers)

All cron scripts are located in `/php` and designed to run via CLI (`php_sapi_name() === 'cli'`).

---

## Cron Job List

### 1. Daily Duty (`dailyduty.php`)

**Purpose**: Database cleanup and maintenance

**Schedule**: Daily at 2:00 AM

**Tasks**:

- Delete expired schedules (`pass_set` where `enddate < TODAY`)
- Remove duplicate user sessions (keep latest per user)
- Delete orphaned sessions (email not in `users` table)
- Clear old login attempts
- Rotate cron logs

**Crontab Entry**:

```cron
0 2 * * * /usr/bin/php /path/to/traino/php/dailyduty.php >> /var/log/traino/dailyduty.log 2>&1
```

**Key Logic**:

```php
// Delete expired schedules
$currentDate = date('Y-m-d');
$sql = "DELETE FROM pass_set WHERE enddate < :currentDate AND enddate IS NOT NULL";

// Keep only latest session per user
$sql = "DELETE FROM user_sessions
        WHERE (user_id, registered) NOT IN (
            SELECT user_id, MAX(registered) FROM user_sessions GROUP BY user_id
        )";

// Delete orphaned sessions
$sql = "DELETE FROM user_sessions WHERE email NOT IN (SELECT email FROM users)";
```

---

### 2. Payment Verification (`aimedpayout.php`)

**Purpose**: Verify pending payments and update transaction statuses

**Schedule**: Hourly (or every 15 minutes for faster processing)

**Tasks**:

- Query `transactions` with `status = 'pending'` and `booked_date < NOW()`
- Retrieve PaymentIntent status from Stripe
- Update transaction status if payment succeeded
- Handle failed/expired payments

**Crontab Entry**:

```cron
*/15 * * * * /usr/bin/php /path/to/traino/php/aimedpayout.php >> /var/log/traino/aimedpayout.log 2>&1
```

**Key Logic**:

```php
$stmt = $pdo->prepare('
    SELECT * FROM transactions
    WHERE booked_date IS NOT NULL
      AND endtime < NOW()
      AND status = :status
      AND productinfo IN (:productinfo1, :productinfo2)
');
$stmt->execute([':status' => 'pending', ':productinfo1' => 'trainingpass', ':productinfo2' => 'onlinetraining']);

foreach ($sessions as $session) {
    $pi = \Stripe\PaymentIntent::retrieve($session['payment_intent_id']);
    
    if ($pi->status === 'succeeded') {
        // Update transaction status
        $sql = "UPDATE transactions SET status = 'completed' WHERE payment_intent_id = :pid";
    }
}
```

**Note**: Script is CLI-only for security (`php_sapi_name() !== 'cli'` check).

---

### 3. Monthly Payouts (`transferpayoutsstripe.php`)

**Purpose**: Transfer accumulated earnings to trainers via Stripe Connect

**Schedule**: Monthly on 28th at 3:00 AM

**Key Features**:

- **Per-Transaction Payouts**: Each pending transaction is processed individually with its own Transfer
- **Idempotency**: Each transfer uses a unique idempotency key to prevent duplicates
- **Charge Linking**: Transfers reference original charge via `source_transaction` for proper accounting
- **Metadata Updates**: Updates destination charge description with booking details

**Tasks**:

- Query pending payouts (transactions before 27th with `payout_status = 'pending'`)
- For each pending transaction:
  - Resolve PaymentIntent → Charge ID via Stripe API
  - Create Stripe Transfer to trainer's connected account
  - Link transfer to original charge using `source_transaction`
  - Update charge description with product/category/duration/date
  - Generate UUID idempotency key per transaction
  - Update transaction: `payout_status = 'completed'`, `stripe_transfer_id`, `payout_date`

**Crontab Entry**:

```cron
0 3 28 * * /usr/bin/php /path/to/traino/php/transferpayoutsstripe.php >> /var/log/traino/payouts.log 2>&1
```

**Key Logic**:

```php
// Query pending payouts (cutoff: 27th of current month)
$cutoff = date('Y-m-27 00:00:00');
$sql = "SELECT t.id AS transaction_id,
               t.trainer_id,
               t.trainer_amount,
               t.product_id,
               t.payment_intent_id,
               t.booked_date,
               u.stripe_id AS trainer_stripe_id
        FROM transactions t
        INNER JOIN users u ON t.trainer_id = u.id
        WHERE t.payout_status = 'pending'
          AND t.booked_date <= :cutoff
          AND u.stripe_id IS NOT NULL
          AND u.stripe_id != ''
        ORDER BY t.trainer_id, t.id";

foreach ($pendingTransactions as $tx) {
    // Step 1: Resolve PaymentIntent -> Charge ID
    $pi = \Stripe\PaymentIntent::retrieve($tx['payment_intent_id']);
    $chargeId = $pi->latest_charge ?? $pi->charges->data[0]->id ?? null;
    
    if (!$chargeId) {
        error_log("Skipping transaction {$tx['transaction_id']}: no charge found");
        continue;
    }
    
    // Step 2: Generate idempotency key
    $idempotencyKey = vsprintf('%s%s-%s-%s-%s-%s%s%s', 
        str_split(bin2hex(random_bytes(16)), 4));
    
    // Step 3: Create Transfer with source_transaction
    $transfer = \Stripe\Transfer::create([
        'amount' => $tx['trainer_amount'], // In öre
        'currency' => 'sek',
        'destination' => $tx['trainer_stripe_id'],
        'source_transaction' => $chargeId, // Links to original charge
        'description' => "Payout for transaction {$tx['transaction_id']}"
    ], ['idempotency_key' => $idempotencyKey]);
    
    // Step 4: Update destination charge description
    try {
        \Stripe\Charge::update($transfer->destination_payment, [
            'description' => buildChargeDescription($tx) // Includes product/category/duration/date
        ], ['stripe_account' => $tx['trainer_stripe_id']]);
    } catch (\Exception $e) {
        error_log("Failed to update charge description: " . $e->getMessage());
    }
    
    // Step 5: Update transaction in database
    $updateSql = "UPDATE transactions
                  SET payout_status = 'completed',
                      stripe_transfer_id = :transfer_id,
                      payout_date = NOW(),
                      idempotency_key = :idempotency_key
                  WHERE id = :transaction_id";
}
```

**Manual Override**:

```bash
# Force run outside of 28th (for testing or missed runs)
php /path/to/traino/php/transferpayoutsstripe.php --force
```

**Error Handling**:

- **Missing `stripe_id`**: Skip trainer, log warning
- **No charge found**: Skip transaction, log error
- **Transfer fails**: Rollback, keep `payout_status = 'pending'`
- **Network error**: Retry with same idempotency key (Stripe deduplicates)

**Logging Example**:

```text
[2025-10-28 03:00:15] Processing 42 pending transactions...
[2025-10-28 03:00:16] Transaction 123: Transfer created (tr_abc123) - 425.00 SEK to trainer 456
[2025-10-28 03:00:16] Transaction 124: Transfer created (tr_def456) - 850.00 SEK to trainer 456
[2025-10-28 03:00:45] Completed 42 transfers successfully
```

---

## Logging

### Log Locations

- **Daily duty**: `/var/log/traino/dailyduty.log`
- **Payment verification**: `/var/log/traino/aimedpayout.log`
- **Payouts**: `/var/log/traino/payouts.log`

### Log Format

```text
[2025-10-31 02:00:15] Running dailyduty.php cronjob...
[2025-10-31 02:00:16] Deleted 42 expired schedules
[2025-10-31 02:00:16] Removed 15 duplicate sessions
[2025-10-31 02:00:16] Daily Duty Cron Job Executed Successfully!
```

### Log Rotation

**Daily duty** clears its own log file:

```php
$cronLogFile = __DIR__ . '/../cron_logs/cronlog.log';
if (file_exists($cronLogFile)) {
    unlink($cronLogFile);
}
```

**System logrotate** (recommended for production):

```conf
/var/log/traino/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
}
```

---

## Error Handling

### Database Errors

```php
try {
    $stmt->execute();
} catch (PDOException $e) {
    error_log("Cron job DB error: " . $e->getMessage());
    exit(1); // Non-zero exit code signals failure to cron
}
```

### Stripe API Errors

```php
try {
    $transfer = \Stripe\Transfer::create([...]);
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log("Stripe Transfer failed: " . $e->getMessage());
    // Mark payout as failed
    $sql = "UPDATE transactions SET payout_status = 'failed' WHERE id IN (...)";
}
```

### Email Notifications (TODO)

```php
// Send admin alert on cron failure
if ($errorOccurred) {
    mail('admin@traino.nu', 'Cron Job Failed: dailyduty.php', $errorMessage);
}
```

---

## Monitoring & Alerts

### Cron Job Monitoring

**Tools**:

- **Cronitor**: External service to monitor cron execution
- **Dead Man's Snitch**: Pings URL after successful run
- **AWS CloudWatch**: Parse logs for errors

**Implementation**:

```php
// Ping monitoring service at end of script
$ch = curl_init('https://cronitor.link/p/abc123/traino-dailyduty');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);
```

### Health Checks

```bash
# Check if cron is running
ps aux | grep cron

# Verify last run time
stat -c %y /var/log/traino/dailyduty.log
```

---

## Testing Cron Jobs Locally

### Manual Execution

```bash
# Run daily duty script
php /path/to/traino/php/dailyduty.php

# Run payout script (force override)
php /path/to/traino/php/transferpayoutsstripe.php --force

# Check output
cat /var/log/traino/dailyduty.log
```

### Mock Data Setup

```sql
-- Insert expired schedule (should be deleted)
INSERT INTO pass_set (user_id, enddate) VALUES (123, '2025-01-01');

-- Insert pending transaction (for payout test)
INSERT INTO transactions (trainer_id, trainer_amount, payout_status, booked_date)
VALUES (456, 42500, 'pending', '2025-10-26');
```

---

## Production Checklist

- [ ] Configure crontab entries on production server
- [ ] Set correct file paths in cron commands
- [ ] Verify PHP binary location (`which php`)
- [ ] Test each cron job manually before scheduling
- [ ] Set up log rotation (logrotate or custom)
- [ ] Configure monitoring/alerting (Cronitor, CloudWatch)
- [ ] Document runbook for cron failures
- [ ] Schedule maintenance windows for risky jobs (payouts)

---

## Troubleshooting

### Cron job not running

**Causes**:

- Incorrect crontab syntax
- PHP binary not in PATH
- File permissions (script not executable)

**Fix**:

```bash
# Check crontab
crontab -l

# Verify PHP path
which php

# Make script executable
chmod +x /path/to/traino/php/dailyduty.php
```

### Payout failures

**Causes**:

- Missing `stripe_id` for trainer
- Insufficient Stripe balance
- Network timeout

**Fix**:

```bash
# Check Stripe balance
stripe balance retrieve

# Retry with --force flag
php transferpayoutsstripe.php --force
```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Payment Processing](PAYMENTS.md)
- [Database Schema](DATABASE.md)

---

**Last Updated**: 2025-11-11

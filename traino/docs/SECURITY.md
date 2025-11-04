# Security Guidelines

This document outlines security practices, token management, CORS/CSRF protection, API authentication, and Stripe signature verification in Traino.

---

## Authentication & Authorization

### API Token Authentication

**All PHP endpoints** require Bearer token authentication:

```php
// apikey.php
$apikey = API_KEY;
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    sendJsonError('Unauthorized: Missing or invalid Authorization header');
    exit;
}

$receivedToken = trim($matches[1]);
if ($receivedToken !== $apikey) {
    http_response_code(403);
    sendJsonError('Forbidden: Invalid API key');
    exit;
}
```

**Frontend Usage**:

```javascript
fetch('https://traino.nu/php/booking.php', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bookingData)
});
```

### Session Management

**User sessions** stored in `user_sessions` table with tokens:

```sql
INSERT INTO user_sessions (user_id, email, session_id)
VALUES (123, AES_ENCRYPT('user@example.com', :key), :session_token);
```

**Session Token Generation**:

```javascript
import { v4 as uuidv4 } from 'uuid';

const sessionToken = uuidv4(); // e.g., "a3c9f1b2-4d5e-..."
```

**Session Validation** (`/php/check_session.php`):

```php
$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_id = :token");
$stmt->execute([':token' => $sessionToken]);
if (!$stmt->fetch()) {
    sendJsonError('Invalid or expired session');
}
```

**Session Cleanup** (cron):

```php
// Delete duplicate sessions (keep latest)
DELETE FROM user_sessions
WHERE (user_id, registered) NOT IN (
    SELECT user_id, MAX(registered) FROM user_sessions GROUP BY user_id
);
```

---

## CORS & CSRF Protection

### CORS Configuration

**Current** (development):

```php
// db.php (commented for localhost)
header('Access-Control-Allow-Origin: https://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
```

**Production** (recommended):

```php
$allowed_origin = 'https://traino.nu';
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
    header('Access-Control-Allow-Credentials: true');
}
```

### CSRF Protection (Implicit)

- **SameSite Cookies**: Not currently used (session tokens in DB)
- **Referer Validation**: Check `HTTP_REFERER` header (optional)
- **Token-Based**: API key acts as CSRF token for state-changing requests

**Future Improvement**:

```php
// Generate CSRF token per session
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Validate on POST
if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    sendJsonError('CSRF token mismatch');
}
```

---

## SQL Injection Prevention

**Always use PDO prepared statements**:

```php
// ❌ NEVER do this:
$sql = "SELECT * FROM users WHERE email = '{$_POST['email']}'";

// ✅ Always do this:
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = AES_ENCRYPT(:email, :key)");
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$stmt->execute();
```

**Validation & Sanitization**:

```php
function validate_and_sanitize($value, $type) {
    switch ($type) {
        case 'integer':
            return filter_var($value, FILTER_VALIDATE_INT);
        case 'email':
            return filter_var($value, FILTER_VALIDATE_EMAIL);
        case 'text':
            return htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
        default:
            return false;
    }
}
```

---

## Data Encryption

### Sensitive Fields (AES-256)

**Encrypted columns**:

- `users.email` (VARBINARY)
- `users.mobilephone` (VARBINARY)
- `users.personalnumber` (VARBINARY)
- `users.user_area`, `user_address`, `user_areacode` (VARBINARY)

**Encryption**:

```sql
INSERT INTO users (email) VALUES (AES_ENCRYPT(:email, :key));
```

**Decryption**:

```sql
SELECT AES_DECRYPT(email, :key) AS email FROM users WHERE id = :user_id;
```

**Key Management**:

- **Environment Variable**: `ENCRYPTION_KEY` (32 bytes, base64-encoded)
- **Storage**: AWS Secrets Manager (production) or `.env.local` (dev)
- **Rotation**: Requires database migration (decrypt with old key, re-encrypt with new)

### Password Hashing

**Use PHP's `password_hash()`**:

```php
// Hash password (bcrypt, cost 10)
$hashed = password_hash($password, PASSWORD_BCRYPT);

// Store in database
INSERT INTO users (user_password) VALUES (:hashed);

// Verify password
if (password_verify($inputPassword, $hashedFromDB)) {
    // Login successful
}
```

**Never store plaintext passwords!**

---

## Stripe Webhook Security

### Signature Verification

**Process** (in `/app/api/stripe/route.js`):

```javascript
const rawBody = await req.text(); // MUST be raw bytes
const sig = req.headers.get('stripe-signature');

try {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  console.error(`❌ Signature verification failed: ${err.message}`);
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Why It Matters**:

- Prevents spoofed webhooks from attackers
- Ensures payload integrity (no tampering)
- Validates request originated from Stripe

### Webhook Secret Rotation

```bash
# 1. Create new webhook endpoint in Stripe Dashboard
# 2. Copy new signing secret (whsec_...)
# 3. Update STRIPE_WEBHOOK_SECRET in production environment
# 4. Deploy code update
# 5. Disable old webhook endpoint
```

---

## Rate Limiting & Abuse Prevention

### Login Attempts Tracking

**Table**: `login_attempts`

```php
// Log failed login
INSERT INTO login_attempts (user_id, email, ipaddress, attempt_time)
VALUES (:user_id, AES_ENCRYPT(:email, :key), AES_ENCRYPT(:ip, :key), NOW());

// Check recent attempts
SELECT COUNT(*) FROM login_attempts
WHERE AES_DECRYPT(email, :key) = :email
  AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE);

if ($attemptCount >= 5) {
    sendJsonError('Too many login attempts. Try again in 15 minutes.');
}
```

**Cleanup** (cron):

```php
// Delete old attempts (>7 days)
DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### API Rate Limiting (Future)

<!-- TODO: Implement Redis-based rate limiting -->

**Recommended**: Use Redis + token bucket algorithm:

```php
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

$key = "rate_limit:{$apiKey}:{$endpoint}";
$limit = 100; // requests per minute
$ttl = 60;

$current = $redis->incr($key);
if ($current === 1) {
    $redis->expire($key, $ttl);
}

if ($current > $limit) {
    http_response_code(429);
    sendJsonError('Rate limit exceeded');
}
```

---

## File Upload Security

### Validation

```javascript
// Allowed MIME types
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}

// Size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 1 * 1024 * 1024; // 1MB

if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
  return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
}
```

### Virus Scanning (Future)

**TODO**: Integrate ClamAV or AWS Macie for malware detection:

```javascript
// After S3 upload, trigger Lambda function for scanning
await lambda.invoke({
  FunctionName: 'scan-uploaded-file',
  Payload: JSON.stringify({ bucket: 'traino', key })
});
```

---

## Logging & Monitoring

### Security Event Logging

**Log Critical Events**:

- Failed login attempts (with IP address)
- API authentication failures
- Stripe webhook verification failures
- Suspicious SQL patterns (manual review)

**Example**:

```php
error_log("Security: Failed login attempt for {$email} from {$ip}");
error_log("Security: Invalid API key used: {$receivedToken}");
```

### Sensitive Data Logging

**NEVER log**:

- Full credit card numbers
- Raw passwords (plaintext or hashed)
- Full PaymentIntent objects (may contain sensitive data)
- API keys, encryption keys

**DO log**:

- PaymentIntent IDs (e.g., `pi_xxx`)
- User IDs (not emails)
- Request/response status codes
- Timestamps and endpoints called

---

## Production Checklist

- [ ] Set strong `API_KEY` and `SERVER_SECRET` (min 32 chars, random)
- [ ] Rotate `ENCRYPTION_KEY` from dev environment
- [ ] Enable CORS restrictions (whitelist `traino.nu` only)
- [ ] Verify `STRIPE_WEBHOOK_SECRET` matches production endpoint
- [ ] Set `NEXT_PUBLIC_DEBUG=false` (no debug output in production)
- [ ] Configure HTTPS/TLS (Vercel automatic, PHP hosting via Let's Encrypt)
- [ ] Enable database backups (daily automated to S3)
- [ ] Set up intrusion detection (fail2ban, AWS GuardDuty)
- [ ] Review IAM policies (least privilege for AWS users)
- [ ] Enable AWS CloudTrail (audit log for API calls)
- [ ] Configure rate limiting (Vercel Edge Config or Redis)
- [ ] Schedule security audits (quarterly penetration tests)

---

## Incident Response

### Suspected API Key Leak

1. **Rotate Key Immediately**:
   - Generate new `API_KEY`
   - Update environment variables
   - Deploy to production

2. **Audit Access Logs**:
   - Check for unauthorized API calls
   - Identify compromised resources

3. **Notify Users** (if data breach):
   - Email affected users
   - Report to GDPR authorities (if applicable)

### Stripe Dispute/Chargeback

1. **Gather Evidence**:
   - Booking confirmation email
   - Session completion proof
   - Communication logs (chat, email)

2. **Submit to Stripe** (Dashboard → Disputes → Upload Evidence)

3. **Pause Payouts** (for disputed transactions):
   ```sql
   UPDATE transactions SET payout_status = 'processing'
   WHERE payment_intent_id = :disputed_pi;
   ```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Payment Processing](PAYMENTS.md)
- [Webhooks](WEBHOOKS.md)

---

**Last Updated**: 2025-11-03

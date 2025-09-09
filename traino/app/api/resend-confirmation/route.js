export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';

// In-memory rate limiter (for production, consider using Redis or database)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 1; // 1 request per window

// Helper function to get client IP
function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  return forwarded ? forwarded.split(',')[0] : realIP || 'unknown';
}

// Helper function to check rate limit
function isRateLimited(identifier) {
  const now = Date.now();
  const userRateData = rateLimitMap.get(identifier) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  // Reset if window has expired
  if (now > userRateData.resetTime) {
    userRateData.count = 0;
    userRateData.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Check if rate limit exceeded
  if (userRateData.count >= MAX_REQUESTS) {
    return { limited: true, resetTime: userRateData.resetTime };
  }

  // Increment count
  userRateData.count += 1;
  rateLimitMap.set(identifier, userRateData);

  return { limited: false };
}

// Cleanup old entries (simple implementation)
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime + RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}

// POST / Resend confirmation email
export const POST = async (req) => {
  DEBUG && console.log('API/Resend Confirmation Received method:', req.method);

  const requestBody = await req.json();
  DEBUG && console.log('API/Resend Confirmation Request Body:', requestBody);

  const { email } = requestBody;

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  // Rate limiting based on IP address and email
  const clientIP = getClientIP(req);
  const identifier = `${clientIP}-${email.toLowerCase()}`;

  const rateLimitResult = isRateLimited(identifier);

  if (rateLimitResult.limited) {
    const remainingTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: `För många försök. Försök igen om ${remainingTime} sekunder.`,
        success: false,
        retryAfter: remainingTime,
      },
      { status: 429 },
    );
  }

  // Cleanup old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupRateLimitMap();
  }

  try {
    const response = await serverFetch(
      'https://traino.nu/php/resend_confirmation.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      },
      null,
      false,
      null, // No session required for this operation
    );

    DEBUG && console.log('API/Resend Confirmation response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
};

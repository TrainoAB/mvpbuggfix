export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Deprecated: This route is intentionally disabled.
// All Stripe webhooks are handled by the consolidated endpoint at /api/stripe.
export async function POST() {
  return NextResponse.json({ error: 'Deprecated webhook route. Use /api/stripe instead.' }, { status: 410 });
}

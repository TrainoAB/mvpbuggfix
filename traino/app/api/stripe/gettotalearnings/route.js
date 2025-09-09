export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { stripe } from '@/app/api/stripe/connect';

export async function POST(req) {
  const body = await req.json();
  const { stripe_id } = body;

  if (!stripe_id) {
    return NextResponse.json({ error: 'stripe_id is required' }, { status: 400 });
  }

  try {
    let totalEarnings = 0;
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      // Bygg parametrar för API-anropet
      const params = { limit: 100 };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      // Hämta balance transactions
      const balanceTransactions = await stripe.balanceTransactions.list(params, {
        stripeAccount: stripe_id,
      });

      // Summera belopp från transaktioner av typen 'payment'
      totalEarnings += balanceTransactions.data
        .filter((transaction) => transaction.type === 'payment') // Endast intäkter
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      hasMore = balanceTransactions.has_more;
      if (hasMore) {
        startingAfter = balanceTransactions.data[balanceTransactions.data.length - 1].id;
      }
    }

    // Returnera totalen i kronor
    return NextResponse.json({ total: totalEarnings / 100 }, { status: 200 });
  } catch (err) {
    console.error('Error fetching total earnings:', err);
    return NextResponse.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}

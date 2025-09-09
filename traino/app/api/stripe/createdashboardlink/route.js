export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { stripe } from '@/app/api/stripe/connect';

export async function POST(req) {
  try {
    const body = await req.json();
    const { stripe_id } = body;

    // First, check if the account has completed onboarding
    const account = await stripe.accounts.retrieve(stripe_id);

    // Check if the account has completed onboarding
    if (!account.details_submitted || !account.charges_enabled) {
      console.log(`Account ${stripe_id} has not completed onboarding yet.`);
      return NextResponse.json(
        {
          error: 'Account has not completed onboarding yet. Please complete your Stripe account setup first.',
          onboardingRequired: true,
        },
        { status: 400 },
      );
    }

    async function createDashboardLink(stripe_id) {
      const link = await stripe.accounts.createLoginLink(stripe_id);
      return link.url; // Ger dig en länk till kundens dashboard
    }

    // Call function
    const dashboardUrl = await createDashboardLink(stripe_id);

    return NextResponse.json({ dashboardUrl }, { status: 200 });
  } catch (err) {
    console.error('Error getting balance from Stripe:', err);
    return NextResponse.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}

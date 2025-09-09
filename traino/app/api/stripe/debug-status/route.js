export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { apiAuth } from '../../apiauth';
import { DEBUG } from '../../secretcontext';
import { ensureStripeIdIsSet } from '../../../functions/fetchDataFunctions';

export const POST = apiAuth(async (req, sessionId) => {
  if (!DEBUG) {
    return NextResponse.json({ error: 'Debug endpoint only available in debug mode' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { user_id } = body;

    console.log('=== STRIPE DEBUG STATUS CHECK ===');
    console.log('Request body:', body);
    console.log('Session ID:', sessionId);

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get current Stripe ID from database
    const stripeIdResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/gettrainerstripe_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('Authorization'),
      },
      body: JSON.stringify({ trainer_id: user_id }),
    });

    const stripeIdData = await stripeIdResponse.json();
    console.log('Current Stripe ID from database:', stripeIdData);

    return NextResponse.json({
      success: true,
      user_id: user_id,
      session_id: sessionId,
      stripe_id_from_db: stripeIdData.stripeId || null,
      stripe_id_response: stripeIdData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug status endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export async function GET(request) {
  if (!DEBUG) {
    return NextResponse.json({ error: 'Debug mode not enabled' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const trainerId = searchParams.get('trainerId');
  const stripeId = searchParams.get('stripeId');

  try {
    switch (action) {
      case 'check_comprehensive':
        if (!trainerId) {
          return NextResponse.json({ error: 'trainerId required for comprehensive check' }, { status: 400 });
        }
        const result = await ensureStripeIdIsSet(trainerId);
        return NextResponse.json({
          action: 'comprehensive_check',
          trainerId,
          result,
          timestamp: new Date().toISOString(),
        });

      case 'manual_update_by_trainer_id':
        if (!trainerId || !stripeId) {
          return NextResponse.json(
            { error: 'Both trainerId and stripeId required for manual update' },
            { status: 400 },
          );
        }

        console.log('Debug: Manual trainer_id update test with:', { trainerId, stripeId });

        const updateResponse = await fetch('https://traino.nu/php/updatestripeidbytrainerid.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripe_id: stripeId,
            trainer_id: trainerId,
          }),
        });

        const updateResult = await updateResponse.json();

        return NextResponse.json({
          action: 'manual_update_by_trainer_id',
          trainerId,
          stripeId,
          updateResponse: {
            status: updateResponse.status,
            ok: updateResponse.ok,
            data: updateResult,
          },
          timestamp: new Date().toISOString(),
        });

      case 'status':
      default:
        return NextResponse.json({
          status: 'Debug endpoint active',
          availableActions: [
            'check_comprehensive - requires trainerId param',
            'manual_update_by_trainer_id - requires trainerId and stripeId params',
            'status - this action',
          ],
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: error.message,
        action,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

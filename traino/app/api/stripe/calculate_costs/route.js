export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (request.method !== 'POST') {
    return new NextResponse(`Method ${request.method} Not Allowed`, {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const body = await request.json();
    const { selectedProducts } = body;

    if (!selectedProducts || !Array.isArray(selectedProducts)) {
      return NextResponse.json({ error: 'Invalid or missing products' }, { status: 400 });
    }

    const totalCost = selectedProducts.reduce((total, product) => total + product.price * product.amount, 0);
    return NextResponse.json({ totalCost: totalCost }, { status: 200 });
  } catch (err) {
    console.error('Error processing request: ', err.message);
    return NextResponse.json({ error: `Cost Calculator Error: ${err.message}` }, { status: 500 });
  }
}

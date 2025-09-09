// app/api/bankid/collect/route.js
export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import axios from 'axios';
import { createHttpsAgent } from '../utils'; // Import from '../utils'

export async function POST(request) {
  try {
    const { orderRef } = await request.json();

    if (!orderRef) {
      return NextResponse.json({ error: 'orderRef is required' }, { status: 400 });
    }

    const agent = await createHttpsAgent();

    const response = await axios.post(
      'https://appapi2.test.bankid.com/rp/v5.1/collect',
      {
        orderRef: orderRef,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error during BankID collect:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}

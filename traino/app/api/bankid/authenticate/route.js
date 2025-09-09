// app/api/bankid/authenticate/route.js
export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const pfxSecretName = process.env.AWS_CERTIFICATE;
const caSecretName = process.env.AWS_ROOT_CA;
const region = process.env.AWS_REGION;
const pfxPassphrase = process.env.BANKID_PASSPHRASE;

const secretsClient = new SecretsManagerClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function fetchSecret(secretName) {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);

    if (response.SecretString !== undefined) {
      return response.SecretString;
    } else if (response.SecretBinary !== undefined) {
      const buff = Buffer.from(response.SecretBinary, 'base64');
      return buff.toString('utf-8');
    } else {
      throw new Error('Secret not found');
    }
  } catch (error) {
    console.error('Error fetching secret:', error);
    throw new Error('Failed to fetch secret from Secrets Manager');
  }
}

async function createHttpsAgent() {
  const [pfxCertBase64, caCertPem] = await Promise.all([
    fetchSecret(pfxSecretName), // AWS_CERTIFICATE (base64-encoded)
    fetchSecret(caSecretName), // AWS_ROOT_CA (PEM format)
  ]);

  // Decode the base64-encoded PFX certificate to a binary buffer
  const pfxBuffer = Buffer.from(pfxCertBase64, 'base64');

  // Use the CA certificate in PEM format directly
  const caCert = caCertPem;

  return new https.Agent({
    pfx: pfxBuffer,
    passphrase: pfxPassphrase,
    ca: caCert,
  });
}

export async function POST(request) {
  try {
    let { personalnumber } = await request.json();

    // Extract real IP or fallback
    const headers = request.headers;
    let endUserIp = headers.get('x-forwarded-for') || '127.0.0.1';

    // Remove dashes and validate
    personalnumber = personalnumber.replace(/-/g, '');
    if (!/^\d{12}$/.test(personalnumber)) {
      return NextResponse.json({ error: 'Invalid personal number format' }, { status: 400 });
    }

    const agent = await createHttpsAgent();

    const response = await axios.post(
      'https://appapi2.test.bankid.com/rp/v5.1/auth',
      {
        personalNumber: personalnumber,
        endUserIp: endUserIp,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: agent,
      },
    );

    return NextResponse.json(response.data); // Send BankID API response back to client
  } catch (error) {
    console.error('Error during BankID authentication:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 },
    );
  }
}

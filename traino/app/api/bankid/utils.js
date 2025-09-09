// app/api/bankid/utils.js
import https from 'https';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// AWS Secrets Manager Setup
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

// Fetch secrets from AWS Secrets Manager
export async function fetchSecret(secretName) {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    return response.SecretString;
  } catch (error) {
    console.error('Error fetching secret:', error);
    throw new Error('Failed to fetch secret from Secrets Manager');
  }
}

// Function to create HTTPS agent with certificates
export async function createHttpsAgent() {
  try {
    // Fetch PFX and Root CA certificates from AWS Secrets Manager
    const pfxData = await fetchSecret(pfxSecretName);
    const caData = await fetchSecret(caSecretName);

    return new https.Agent({
      pfx: Buffer.from(pfxData, 'base64'),
      ca: caData,
      passphrase: pfxPassphrase,
    });
  } catch (error) {
    console.error('Error creating HTTPS agent:', error);
    throw error;
  }
}

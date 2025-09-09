require('dotenv').config();

const requiredEnvVars = [
  'NEXT_PUBLIC_STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_API_KEY',
  'NEXT_PUBLIC_AWS_ACCESS_KEY_ID',
  'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_AWS_BUCKET_NAME',
  'NEXT_PUBLIC_DEBUG',
  'NEXT_PUBLIC_DEVELOPMENT_MODE',
  'NEXT_PUBLIC_BASE_URL',
  'STRIPE_SECRET_KEY',
  'SERVER_SECRET',
  'API_KEY',
  'PASSWORD',
];

let missingVars = false;

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    missingVars = true;
  }
});

if (missingVars) {
  console.error('Missing variables.');
} else {
  console.log('All required environment variables are set.');
}

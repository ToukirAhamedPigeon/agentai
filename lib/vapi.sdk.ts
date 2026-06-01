import Vapi from '@vapi-ai/web';

// The VAPI web SDK expects the public key (UUID format)
const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

if (!publicKey) {
  throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Please check your environment variables.');
}

// Validate key format (should be UUID format)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(publicKey)) {
  console.warn('VAPI public key does not look like a valid UUID:', publicKey);
}

console.log('VAPI SDK initialized with public key');

export const vapi = new Vapi(publicKey);
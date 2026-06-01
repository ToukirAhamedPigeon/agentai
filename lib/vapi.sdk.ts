import Vapi from '@vapi-ai/web';

// VAPI requires the public key, not a web token
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);

// Log initialization for debugging
if (typeof window !== 'undefined') {
  console.log('VAPI initialized with key:', process.env.NEXT_PUBLIC_VAPI_API_KEY ? 'Present' : 'Missing');
}
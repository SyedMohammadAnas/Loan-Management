import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the browser
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Helper function to check if an email is authorized
export const isAuthorizedEmail = (email: string): boolean => {
  if (!email) return false;

  // Normalize the input email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // IMPORTANT: For client components, we need to use NEXT_PUBLIC_ prefixed env variables
  const authorizedEmailsEnv = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || process.env.AUTHORIZED_EMAILS || '';

  // Get the list of authorized emails from env, split by comma, and normalize each one
  const authorizedEmails = authorizedEmailsEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0); // Filter out empty entries

  // For debugging
  console.log('Authorized emails:', authorizedEmails);
  console.log('Checking email:', normalizedEmail);
  console.log('Is authorized:', authorizedEmails.includes(normalizedEmail));

  // Check if the normalized email is in the authorized list
  return authorizedEmails.includes(normalizedEmail);
};

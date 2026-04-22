'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

/**
 * Client-side provider wrapper.
 * Keeps the root layout a Server Component while still
 * giving all child components access to useAuth().
 */
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

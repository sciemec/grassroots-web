'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Rendered inside the landing page (server component).
 * Once Zustand has rehydrated, redirects logged-in users to /arena
 * so the Arena feed becomes their home base.
 */
export default function AuthRedirect() {
  const router   = useRouter();
  const user         = useAuthStore((s) => s.user);
  const hasHydrated  = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) {
      router.replace('/arena');
    }
  }, [hasHydrated, user, router]);

  return null;
}

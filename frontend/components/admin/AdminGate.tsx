'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { makeAPICall, currentUser } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // If you want to keep the previous “always allow” stub, replace the next line with:
        // if (!cancelled) setAllowed(true);
        await makeAPICall('/admin/health', 'GET', null, /* useAuth */ true);
        if (!cancelled) setAllowed(true);
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setAllowed(false);
          setErr(message || 'Not authorized');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [makeAPICall, currentUser]);

  if (allowed === null) {
    return (
      <div className="container mx-auto p-6 text-sm text-gray-600">
        Checking admin access…
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Admin only</h1>
        <p className="text-gray-700">You don’t have access to this page. {err ? `(${err})` : null}</p>
      </div>
    );
  }
  return <>{children}</>;
}

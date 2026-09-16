'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { useRouter } from 'next/navigation';

export default function OpsRootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'BORROWER') {
        router.push('/borrower');
      } else {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-slate-400 font-medium">
      Redirecting to assigned workspace...
    </div>
  );
}

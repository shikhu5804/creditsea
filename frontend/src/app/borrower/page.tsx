'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function BorrowerRootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'BORROWER') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      } else {
        // Fetch borrower loans to decide destination
        api.get('/loans/my-loans').then((res) => {
          const loans = res.data.loans || [];
          if (loans.length > 0) {
            router.replace('/borrower/loans');
          } else {
            router.replace('/borrower/apply');
          }
        }).catch(() => {
          router.replace('/borrower/apply');
        });
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">
      Redirecting to your borrower workspace...
    </div>
  );
}

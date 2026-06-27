'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoggedIn, _hasHydrated, pathname, router]);

  // Still reading localStorage — show spinner, never redirect yet
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  // Hydrated but not logged in — spinner while redirect fires
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

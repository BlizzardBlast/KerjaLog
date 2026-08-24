import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { observeWeeklyReflectionNotificationResponses } from '@/platform/notifications/weeklyReflection';

export function useWeeklyReflectionNotificationNavigation(
  enabled: boolean,
): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return observeWeeklyReflectionNotificationResponses(() => {
      if (pathname !== '/reflection') {
        router.push('/reflection');
      }
    });
  }, [enabled, pathname, router]);
}

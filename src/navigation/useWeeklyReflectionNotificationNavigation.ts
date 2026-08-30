import { usePathname, useRouter } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';
import { observeWeeklyReflectionNotificationResponses } from '@/platform/notifications/weeklyReflection';

export function useWeeklyReflectionNotificationNavigation(
  enabled: boolean,
): void {
  const router = useRouter();
  const pathname = usePathname();
  const openReflection = useEffectEvent(() => {
    if (pathname !== '/reflection') {
      router.push('/reflection');
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return observeWeeklyReflectionNotificationResponses(openReflection);
  }, [enabled]);
}

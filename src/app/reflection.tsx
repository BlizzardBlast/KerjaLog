import { WeeklyReflectionScreen } from '@/features/weekly-reflection/WeeklyReflectionScreen';
import { ProtectedAppRoute } from '@/shared/components/ProtectedAppRoute';

export default function WeeklyReflectionRoute() {
  return (
    <ProtectedAppRoute>
      <WeeklyReflectionScreen />
    </ProtectedAppRoute>
  );
}

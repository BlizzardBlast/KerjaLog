import { LogScreen } from '@/features/work-entry/LogScreen';
import { ProtectedAppRoute } from '@/shared/components/ProtectedAppRoute';

export default function NewWorkEntryRoute() {
  return (
    <ProtectedAppRoute>
      <LogScreen />
    </ProtectedAppRoute>
  );
}

import { useLocalSearchParams } from 'expo-router';
import { EditEntryScreen } from '@/features/work-entry/refinement/EditEntryScreen';
import { ProtectedAppRoute } from '@/shared/components/ProtectedAppRoute';

export default function EditWorkEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ProtectedAppRoute>
      <EditEntryScreen id={id} />
    </ProtectedAppRoute>
  );
}

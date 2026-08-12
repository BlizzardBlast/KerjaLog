import { useLocalSearchParams } from 'expo-router';
import { SavedEntryScreen } from '@/features/work-entry/SavedEntryScreen';
import { ProtectedAppRoute } from '@/shared/components/ProtectedAppRoute';

export default function SavedWorkEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ProtectedAppRoute>
      <SavedEntryScreen id={id} />
    </ProtectedAppRoute>
  );
}

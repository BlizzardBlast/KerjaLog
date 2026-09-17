import { useLocalSearchParams } from 'expo-router';
import { ReviewDraftScreen } from '@/features/review/ReviewDraftScreen';
import { ProtectedAppRoute } from '@/shared/components/ProtectedAppRoute';

export default function ReviewDraftRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ProtectedAppRoute>
      <ReviewDraftScreen id={id} />
    </ProtectedAppRoute>
  );
}

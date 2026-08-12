import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Alert } from 'react-native';

type MutableFlag = {
  current: boolean;
};

type LogDraftNavigationCopy = {
  title: string;
  description: string;
  keepEditing: string;
  discard: string;
};

type UseLogDraftNavigationGuardOptions = {
  hasUnsavedDraft: boolean;
  currentStep: number;
  onInternalBack: () => void;
  allowNextRemovalRef: MutableFlag;
  copy: LogDraftNavigationCopy;
};

export function useLogDraftNavigationGuard({
  hasUnsavedDraft,
  currentStep,
  onInternalBack,
  allowNextRemovalRef,
  copy,
}: UseLogDraftNavigationGuardOptions): void {
  const navigation = useNavigation();

  usePreventRemove(hasUnsavedDraft, ({ data }) => {
    if (allowNextRemovalRef.current) {
      allowNextRemovalRef.current = false;
      navigation.dispatch(data.action);
      return;
    }

    if (currentStep > 1) {
      onInternalBack();
      return;
    }

    Alert.alert(copy.title, copy.description, [
      {
        text: copy.keepEditing,
        style: 'cancel',
      },
      {
        text: copy.discard,
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });
}

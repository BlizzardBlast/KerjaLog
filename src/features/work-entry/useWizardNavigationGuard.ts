import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useRef } from 'react';
import { Alert } from 'react-native';

type NavigationCopy = {
  title: string;
  description: string;
  keepEditing: string;
  discard: string;
};

type Options = {
  hasUnsavedChanges: boolean;
  currentStep: number;
  isComplete?: boolean;
  onInternalBack: () => void;
  onDiscard: () => Promise<boolean>;
  copy: NavigationCopy;
};

export function useWizardNavigationGuard({
  hasUnsavedChanges,
  currentStep,
  isComplete = false,
  onInternalBack,
  onDiscard,
  copy,
}: Options) {
  const navigation = useNavigation();
  const allowRemovalRef = useRef(false);
  const shouldPreventRemoval =
    !isComplete && (hasUnsavedChanges || currentStep > 1);

  usePreventRemove(shouldPreventRemoval, ({ data }) => {
    if (allowRemovalRef.current) {
      allowRemovalRef.current = false;
      navigation.dispatch(data.action);
      return;
    }

    if (currentStep > 1) {
      onInternalBack();
      return;
    }

    Alert.alert(copy.title, copy.description, [
      { text: copy.keepEditing, style: 'cancel' },
      {
        text: copy.discard,
        style: 'destructive',
        onPress: () => {
          void onDiscard().then((discarded) => {
            if (discarded) {
              navigation.dispatch(data.action);
            }
          });
        },
      },
    ]);
  });

  return () => {
    allowRemovalRef.current = true;
  };
}

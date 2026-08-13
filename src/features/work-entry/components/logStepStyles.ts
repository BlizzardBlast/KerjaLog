import { StyleSheet } from 'react-native';
import { spacing } from '@/design-system/tokens/theme';

export const logStepStyles = StyleSheet.create({
  choiceList: {
    gap: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  flexButton: {
    flexBasis: 156,
    flexGrow: 1,
  },
});

import { Platform, type ViewStyle } from 'react-native';

type WebCompatibleScrollStyle = ViewStyle & {
  overscrollBehavior?: 'auto' | 'contain' | 'none';
};

export const screenScrollBoundaryStyle = Platform.select<WebCompatibleScrollStyle>({
  web: {
    overscrollBehavior: 'none',
  },
  default: {},
});

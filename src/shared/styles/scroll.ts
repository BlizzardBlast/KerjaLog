import { Platform, type ViewStyle } from 'react-native';

type WebCompatibleScrollStyle = ViewStyle & {
  overscrollBehavior?: 'auto' | 'contain' | 'none';
  overscrollBehaviorY?: 'auto' | 'contain' | 'none';
  overflowAnchor?: 'auto' | 'none';
};

export const screenScrollBoundaryStyle =
  Platform.select<WebCompatibleScrollStyle>({
    web: {
      overscrollBehavior: 'none',
      overscrollBehaviorY: 'none',
      overflowAnchor: 'none',
    },
    default: {},
  });

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Colors } from '../theme';

export const appStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: Colors.fdPrimary,
  },
  headerTintColor: Colors.textDark,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 18,
  },
  headerShadowVisible: true,
  contentStyle: {
    backgroundColor: Colors.fdBackground,
  },
};

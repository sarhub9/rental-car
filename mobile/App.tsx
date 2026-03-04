import React from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { Colors } from './src/theme';

import AuthStack from './src/navigation/AuthStack';
import FrontDeskStack from './src/navigation/FrontDeskStack';
import CustomerStack from './src/navigation/CustomerStack';
import OwnerAdminStack from './src/navigation/OwnerAdminStack';
import DriverRecoveryStack from './src/navigation/DriverRecoveryStack';
import FleetManagerStack from './src/navigation/FleetManagerStack';
import AccountsStack from './src/navigation/AccountsStack';

enableScreens(true);

LogBox.ignoreLogs([
  "TypeError: Cannot read property 'dismiss'",
  'SafeAreaView has been deprecated',
]);

const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (!isFatal && error?.message?.includes('dismiss')) {
    return;
  }
  originalHandler(error, isFatal);
});

const SplashScreen: React.FC = () => (
  <View style={styles.splash}>
    <ActivityIndicator size="large" color={Colors.fdPrimary} />
  </View>
);

const appNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.fdBackground,
    card: Colors.fdPrimary,
    text: Colors.textDark,
    border: Colors.borderLight,
    primary: Colors.fdPrimary,
  },
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (user?.role === 'RENTAL_CUSTOMER') {
    return <CustomerStack />;
  }

  if (user?.role === 'OWNER_ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <OwnerAdminStack />;
  }

  if (user?.role === 'DRIVER_RECOVERY') {
    return <DriverRecoveryStack />;
  }

  if (user?.role === 'FLEET_MANAGER') {
    return <FleetManagerStack />;
  }

  if (user?.role === 'ACCOUNTS') {
    return <AccountsStack />;
  }

  return <FrontDeskStack />;
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={appNavigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default App;

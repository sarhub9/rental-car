import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import StaffLoginScreen from '../screens/admin/StaffLoginScreen';

export type AuthStackParamList = {
  Login: undefined;
  StaffLogin: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;

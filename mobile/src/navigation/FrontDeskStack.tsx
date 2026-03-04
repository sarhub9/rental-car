import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

import AgreementListScreen from '../screens/AgreementListScreen';
import AgreementCreateScreen from '../screens/AgreementCreateScreen';
import AgreementEditScreen from '../screens/AgreementEditScreen';
import AgreementViewScreen from '../screens/AgreementViewScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ReturnScreen from '../screens/ReturnScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const FrontDeskStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AgreementList"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen
        name="AgreementList"
        component={AgreementListScreen}
        options={{ title: 'Rental Agreements' }}
      />
      <Stack.Screen
        name="AgreementCreate"
        component={AgreementCreateScreen}
        options={{ title: 'New Rental Agreement' }}
      />
      <Stack.Screen
        name="AgreementEdit"
        component={AgreementEditScreen}
        options={{ title: 'Edit Agreement' }}
      />
      <Stack.Screen
        name="AgreementView"
        component={AgreementViewScreen}
        options={{ title: 'Agreement Details' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Vehicle Checkout' }}
      />
      <Stack.Screen
        name="Return"
        component={ReturnScreen}
        options={{ title: 'Vehicle Return' }}
      />
    </Stack.Navigator>
  );
};

export default FrontDeskStack;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountsStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

import AccountsDashboardScreen from '../screens/accounts/AccountsDashboardScreen';
import AccountsInvoiceListScreen from '../screens/accounts/AccountsInvoiceListScreen';
import AccountsInvoiceDetailScreen from '../screens/accounts/AccountsInvoiceDetailScreen';
import AccountsPaymentListScreen from '../screens/accounts/AccountsPaymentListScreen';
import AccountsReportsScreen from '../screens/accounts/AccountsReportsScreen';
import DepositListScreen from '../screens/accounts/DepositListScreen';
import TollFineListScreen from '../screens/accounts/TollFineListScreen';

const Stack = createNativeStackNavigator<AccountsStackParamList>();

const AccountsStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AccountsDashboard"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen name="AccountsDashboard" component={AccountsDashboardScreen} options={{ title: 'Accounts' }} />
      <Stack.Screen name="AccountsInvoiceList" component={AccountsInvoiceListScreen} options={{ title: 'All Invoices' }} />
      <Stack.Screen name="AccountsInvoiceDetail" component={AccountsInvoiceDetailScreen} options={{ title: 'Invoice Detail' }} />
      <Stack.Screen name="AccountsPaymentList" component={AccountsPaymentListScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="AccountsReports" component={AccountsReportsScreen} options={{ title: 'Financial Reports' }} />
      <Stack.Screen name="DepositList" component={DepositListScreen} options={{ title: 'Deposits' }} />
      <Stack.Screen name="TollFineList" component={TollFineListScreen} options={{ title: 'Tolls & Fines' }} />
    </Stack.Navigator>
  );
};

export default AccountsStack;

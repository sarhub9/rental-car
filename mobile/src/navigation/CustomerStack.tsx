import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

// Customer screens
import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import MyRentalsScreen from '../screens/customer/MyRentalsScreen';
import CustomerAgreementDetailScreen from '../screens/customer/CustomerAgreementDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import InvoiceListScreen from '../screens/customer/InvoiceListScreen';
import InvoiceDetailScreen from '../screens/customer/InvoiceDetailScreen';
import DisputeListScreen from '../screens/customer/DisputeListScreen';
import DisputeDetailScreen from '../screens/customer/DisputeDetailScreen';
import CreateDisputeScreen from '../screens/customer/CreateDisputeScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import MessagesScreen from '../screens/customer/MessagesScreen';
import ChatThreadScreen from '../screens/customer/ChatThreadScreen';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

const CustomerStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="CustomerDashboard"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen
        name="CustomerDashboard"
        component={CustomerDashboardScreen}
        options={{ title: 'My Dashboard' }}
      />
      <Stack.Screen
        name="MyRentals"
        component={MyRentalsScreen}
        options={{ title: 'My Rentals' }}
      />
      <Stack.Screen
        name="AgreementDetail"
        component={CustomerAgreementDetailScreen}
        options={{ title: 'Rental Details' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={{ title: 'My Invoices' }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
      <Stack.Screen
        name="Disputes"
        component={DisputeListScreen}
        options={{ title: 'My Disputes' }}
      />
      <Stack.Screen
        name="DisputeDetail"
        component={DisputeDetailScreen}
        options={{ title: 'Dispute' }}
      />
      <Stack.Screen
        name="CreateDispute"
        component={CreateDisputeScreen}
        options={{ title: 'Raise Dispute' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

export default CustomerStack;

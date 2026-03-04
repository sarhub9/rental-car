import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerAdminStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserListScreen from '../screens/admin/UserListScreen';
import UserCreateScreen from '../screens/admin/UserCreateScreen';
import UserEditScreen from '../screens/admin/UserEditScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import AuditLogScreen from '../screens/admin/AuditLogScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import KpiDashboardScreen from '../screens/admin/KpiDashboardScreen';

// Shared screens accessible by admin
import AgreementListScreen from '../screens/AgreementListScreen';
import AgreementViewScreen from '../screens/AgreementViewScreen';
import FleetVehicleListScreen from '../screens/fleet/FleetVehicleListScreen';
import FleetVehicleDetailScreen from '../screens/fleet/FleetVehicleDetailScreen';
import { FleetVehicleCreateScreen, FleetVehicleEditScreen } from '../screens/fleet/FleetVehicleFormScreen';
import AccountsInvoiceListScreen from '../screens/accounts/AccountsInvoiceListScreen';
import AccountsInvoiceDetailScreen from '../screens/accounts/AccountsInvoiceDetailScreen';

const Stack = createNativeStackNavigator<OwnerAdminStackParamList>();

const OwnerAdminStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="UserCreate" component={UserCreateScreen} options={{ title: 'Create User' }} />
      <Stack.Screen name="UserEdit" component={UserEditScreen} options={{ title: 'Edit User' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ title: 'Audit Logs' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="AdminAgreementList" component={AgreementListScreen} options={{ title: 'Agreements' }} />
      <Stack.Screen name="AdminAgreementView" component={AgreementViewScreen} options={{ title: 'Agreement Details' }} />
      <Stack.Screen name="AdminInvoiceList" component={AccountsInvoiceListScreen} options={{ title: 'Invoices' }} />
      <Stack.Screen name="AdminInvoiceDetail" component={AccountsInvoiceDetailScreen} options={{ title: 'Invoice Detail' }} />
      <Stack.Screen name="AdminVehicleList" component={FleetVehicleListScreen} options={{ title: 'Vehicles' }} />
      <Stack.Screen name="FleetVehicleCreate" component={FleetVehicleCreateScreen} options={{ title: 'Add Vehicle' }} />
      <Stack.Screen name="FleetVehicleDetail" component={FleetVehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
      <Stack.Screen name="FleetVehicleEdit" component={FleetVehicleEditScreen} options={{ title: 'Edit Vehicle' }} />
      <Stack.Screen name="KpiDashboard" component={KpiDashboardScreen} options={{ title: 'KPI Dashboard' }} />
    </Stack.Navigator>
  );
};

export default OwnerAdminStack;

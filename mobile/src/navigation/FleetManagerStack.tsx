import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FleetManagerStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

import FleetDashboardScreen from '../screens/fleet/FleetDashboardScreen';
import FleetVehicleListScreen from '../screens/fleet/FleetVehicleListScreen';
import FleetVehicleDetailScreen from '../screens/fleet/FleetVehicleDetailScreen';
import { FleetVehicleCreateScreen, FleetVehicleEditScreen } from '../screens/fleet/FleetVehicleFormScreen';
import MaintenanceListScreen from '../screens/fleet/MaintenanceListScreen';
import WorkOrderDetailScreen from '../screens/fleet/WorkOrderDetailScreen';

const Stack = createNativeStackNavigator<FleetManagerStackParamList>();

const FleetManagerStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="FleetDashboard"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen name="FleetDashboard" component={FleetDashboardScreen} options={{ title: 'Fleet Dashboard' }} />
      <Stack.Screen name="FleetVehicleList" component={FleetVehicleListScreen} options={{ title: 'All Vehicles' }} />
      <Stack.Screen name="FleetVehicleDetail" component={FleetVehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
      <Stack.Screen name="FleetVehicleCreate" component={FleetVehicleCreateScreen} options={{ title: 'Add Vehicle' }} />
      <Stack.Screen name="FleetVehicleEdit" component={FleetVehicleEditScreen} options={{ title: 'Edit Vehicle' }} />
      <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
      <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} options={{ title: 'Work Order' }} />
    </Stack.Navigator>
  );
};

export default FleetManagerStack;

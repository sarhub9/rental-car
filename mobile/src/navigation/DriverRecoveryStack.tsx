import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverRecoveryStackParamList } from '../types';
import { appStackScreenOptions } from './sharedScreenOptions';

import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import TaskDetailScreen from '../screens/driver/TaskDetailScreen';
import DeliveryScreen from '../screens/driver/DeliveryScreen';
import PickupScreen from '../screens/driver/PickupScreen';
import RecoveryScreen from '../screens/driver/RecoveryScreen';
import TaskHistoryScreen from '../screens/driver/TaskHistoryScreen';

const Stack = createNativeStackNavigator<DriverRecoveryStackParamList>();

const DriverRecoveryStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="DriverDashboard"
      screenOptions={appStackScreenOptions}
    >
      <Stack.Screen
        name="DriverDashboard"
        component={DriverDashboardScreen}
        options={{ title: 'My Tasks' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen
        name="Delivery"
        component={DeliveryScreen}
        options={{ title: 'Vehicle Delivery' }}
      />
      <Stack.Screen
        name="Pickup"
        component={PickupScreen}
        options={{ title: 'Vehicle Pickup' }}
      />
      <Stack.Screen
        name="Recovery"
        component={RecoveryScreen}
        options={{ title: 'Vehicle Recovery' }}
      />
      <Stack.Screen
        name="TaskHistory"
        component={TaskHistoryScreen}
        options={{ title: 'Task History' }}
      />
    </Stack.Navigator>
  );
};

export default DriverRecoveryStack;

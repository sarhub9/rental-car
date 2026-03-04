import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import VehicleApiService from '../../services/vehicle-api.service';
import { FleetManagerStackParamList, Vehicle, VehicleStatus } from '../../types';

type NavProp = NativeStackNavigationProp<FleetManagerStackParamList>;
type RouteType = RouteProp<FleetManagerStackParamList, 'FleetVehicleDetail'>;

const STATUS_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: Colors.success, RENTED: Colors.primary,
  MAINTENANCE: Colors.warning, OUT_OF_SERVICE: Colors.error,
};

const FleetVehicleDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVehicle = useCallback(async () => {
    try {
      const data = await VehicleApiService.getVehicle(vehicleId);
      setVehicle(data);
    } catch (err) {
      console.error('Vehicle detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { loadVehicle(); }, [loadVehicle]);

  const handleStatusChange = async (newStatus: VehicleStatus) => {
    try {
      await VehicleApiService.updateVehicle(vehicleId, { status: newStatus } as any);
      setVehicle(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading || !vehicle) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={loadVehicle} />}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{vehicle.make} {vehicle.model} ({vehicle.year})</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[vehicle.status] }]}>
          <Text style={styles.badgeText}>{vehicle.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.plate}>{vehicle.plate_emirate} {vehicle.plate_number}</Text>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <InfoRow label="Color" value={vehicle.color} />
        <InfoRow label="Transmission" value={vehicle.transmission_type} />
        <InfoRow label="Fuel Type" value={vehicle.fuel_type} />
        <InfoRow label="Chassis Number" value={vehicle.chassis_number} />
        <InfoRow label="Odometer" value={`${vehicle.current_odometer?.toLocaleString() || 0} km`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rates</Text>
        <InfoRow label="Daily Rate" value={`AED ${vehicle.daily_rate || 0}`} />
        <InfoRow label="Weekly Rate" value={`AED ${vehicle.weekly_rate || 0}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance</Text>
        <InfoRow label="Registration Expiry" value={vehicle.registration_expiry ? new Date(vehicle.registration_expiry).toLocaleDateString() : '—'} />
        <InfoRow label="Insurance Expiry" value={vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : '—'} />
      </View>

      {/* Status Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Status</Text>
        <View style={styles.statusActions}>
          {(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'] as VehicleStatus[])
            .filter(s => s !== vehicle.status)
            .map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[s] }]}
                onPress={() => Alert.alert('Confirm', `Mark as ${s.replace('_', ' ')}?`, [
                  { text: 'Cancel' },
                  { text: 'Yes', onPress: () => handleStatusChange(s) },
                ])}
              >
                <Text style={styles.statusBtnText}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('FleetVehicleEdit', { vehicleId: vehicle.id })}
      >
        <Text style={styles.editBtnText}>Edit Vehicle</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.h2, color: Colors.text, flex: 1 },
  plate: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.xl },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  badgeText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  infoValue: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  statusBtnText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },
  editBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  editBtnText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
});

export default FleetVehicleDetailScreen;

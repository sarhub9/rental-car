import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import vehicleApiService from '../services/vehicle-api.service';
import { Colors, Spacing } from '../theme';
import type { Vehicle } from '../types';

interface Props {
  visible: boolean;
  startDate?: string;
  endDate?: string;
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
}

const VehicleSearchModal: React.FC<Props> = ({ visible, startDate, endDate, onSelect, onClose }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadVehicles();
    }
  }, [visible]);

  const loadVehicles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (startDate && endDate) {
        const result = await vehicleApiService.searchAvailable(startDate, endDate);
        setVehicles(result);
      } else {
        const result = await vehicleApiService.listVehicles({ status: 'AVAILABLE' });
        setVehicles(result);
      }
    } catch (err: any) {
      console.error('Vehicle load error:', err?.response?.data || err.message);
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to load vehicles');
      // Fallback: try loading all available vehicles if date search failed
      if (startDate && endDate) {
        try {
          const result = await vehicleApiService.listVehicles({ status: 'AVAILABLE' });
          setVehicles(result);
          setErrorMsg(null);
        } catch {
          setVehicles([]);
        }
      } else {
        setVehicles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.make} {item.model} ({item.year})</Text>
        {item.category_name && (
          <Text style={styles.itemBadge}>{item.category_name}</Text>
        )}
      </View>
      <Text style={styles.itemDetail}>
        Plate: {item.plate_number} - {item.plate_emirate}
      </Text>
      {item.color && <Text style={styles.itemDetail}>Color: {item.color}</Text>}
      <View style={styles.rateRow}>
        {item.daily_rate && (
          <Text style={styles.rate}>AED {item.daily_rate}/day</Text>
        )}
        {item.weekly_rate && (
          <Text style={styles.rate}>AED {item.weekly_rate}/week</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Vehicle</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        {startDate && endDate && (
          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              Available for: {new Date(startDate).toLocaleDateString()} -{' '}
              {new Date(endDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {errorMsg && (
              <View style={styles.errorWrap}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}> {errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadVehicles}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                !errorMsg ? (
                  <View style={styles.emptyWrap}>
                    <MaterialCommunityIcons name="car-off" size={48} color={Colors.textLight} />
                    <Text style={styles.emptyText}>No available vehicles found</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadVehicles}>
                      <Text style={styles.retryText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              }
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textGold },
  closeBtn: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  dateInfo: {
    padding: Spacing.md, marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.info + '15', borderRadius: 8,
  },
  dateInfoText: { fontSize: 14, color: Colors.info },
  loader: { marginTop: 40 },
  item: {
    padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.textDark },
  itemBadge: {
    fontSize: 12, color: Colors.success,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  itemDetail: { fontSize: 14, color: Colors.textSecondary },
  rateRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  rate: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    margin: Spacing.lg, padding: Spacing.md,
    backgroundColor: Colors.error + '15',
    borderRadius: 8, borderWidth: 1, borderColor: Colors.error + '30',
  },
  errorText: { color: Colors.error, fontSize: 14, flex: 1 },
  retryBtn: {
    marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: 6,
  },
  retryText: { color: Colors.textDark, fontWeight: '700', fontSize: 14 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyText: {
    textAlign: 'center', color: Colors.textSecondary,
    marginTop: Spacing.md, fontSize: 16,
  },
});

export default VehicleSearchModal;

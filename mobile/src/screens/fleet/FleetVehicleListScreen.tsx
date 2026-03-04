import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';
import VehicleApiService from '../../services/vehicle-api.service';
import { FleetManagerStackParamList, Vehicle, VehicleStatus } from '../../types';

type NavProp = NativeStackNavigationProp<FleetManagerStackParamList>;

const STATUS_CONFIG: Record<VehicleStatus, { color: string; icon: string }> = {
  AVAILABLE: { color: Colors.success, icon: 'check-circle' },
  RENTED: { color: Colors.primary, icon: 'car-key' },
  MAINTENANCE: { color: Colors.warning, icon: 'wrench' },
  OUT_OF_SERVICE: { color: Colors.error, icon: 'close-circle' },
};

const FleetVehicleListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadVehicles = useCallback(async () => {
    try {
      const list = await VehicleApiService.listVehicles();
      setVehicles(list);
      applyFilters(list, search, statusFilter);
    } catch (err) {
      console.error('Vehicle list error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const applyFilters = (list: Vehicle[], q: string, status: string) => {
    let result = list;
    if (status !== 'ALL') result = result.filter(v => v.status === status);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(v =>
        v.make.toLowerCase().includes(lower) ||
        v.model.toLowerCase().includes(lower) ||
        v.plate_number.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  };

  useEffect(() => { applyFilters(vehicles, search, statusFilter); }, [search, statusFilter]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadVehicles(); }, [loadVehicles]);

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('FleetVehicleDetail', { vehicleId: item.id })}
      >
        <View style={styles.cardInner}>
          <View style={[styles.cardIconWrap, { backgroundColor: cfg.color + '20' }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.plate_emirate} {item.plate_number} | {item.year} | {item.color || '—'}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="speedometer" size={12} color={Colors.textLight} />
                <Text style={styles.cardMeta}> {item.current_odometer?.toLocaleString() || 0} km</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="cash" size={12} color={Colors.primary} />
                <Text style={[styles.cardMeta, { color: Colors.primary }]}> AED {item.daily_rate || 0}/day</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.textLight} style={{ marginLeft: Spacing.md }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search make, model, plate..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Status filter tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'].map(s => {
          const isActive = statusFilter === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setStatusFilter(s)}
            >
              {s !== 'ALL' && (
                <MaterialCommunityIcons
                  name={STATUS_CONFIG[s as VehicleStatus]?.icon as any}
                  size={12}
                  color={isActive ? Colors.textDark : Colors.textLight}
                  style={{ marginRight: 3 }}
                />
              )}
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {s === 'OUT_OF_SERVICE' ? 'OOS' : s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderVehicle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="car-off" size={42} color={Colors.textLight} />
            <Text style={styles.empty}>No vehicles found</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('FleetVehicleCreate')}
      >
        <Ionicons name="add" size={28} color={Colors.textDark} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    ...Shadow3D.cardLight,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },

  filterRow: { flexDirection: 'row', marginBottom: Spacing.md, flexWrap: 'wrap', gap: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { ...Typography.caption, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.textDark, fontWeight: '700' },

  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.card,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...Typography.body, fontWeight: '700', color: Colors.textGold },
  badge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.round, borderWidth: 1,
  },
  badgeText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  cardSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { ...Typography.caption, color: Colors.textLight },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xxl },
  empty: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.md },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow3D.fab,
  },
});

export default FleetVehicleListScreen;

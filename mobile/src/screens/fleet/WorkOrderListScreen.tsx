import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WorkOrderApiService from '../../services/work-order-api.service';
import { Colors } from '../../theme';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#888',
  ASSIGNED: '#2196F3',
  IN_PROGRESS: '#FF9800',
  WAITING_PARTS: '#9C27B0',
  COMPLETE: '#4CAF50',
  CANCELLED: '#F44336',
};

export default function WorkOrderListScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await WorkOrderApiService.listWorkOrders({ limit: 50 });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, item.blocks_rental && styles.blocking]}
      onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: item.id })}
    >
      <View style={styles.row}>
        <Text style={styles.woNumber}>{item.work_order_number}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.vehicle}>{item.make} {item.model} • {item.plate_number}</Text>
      <Text style={styles.type}>{item.maintenance_type} • {item.priority}</Text>
      {item.blocks_rental && <Text style={styles.blockingLabel}>BLOCKS RENTAL</Text>}
      {item.estimated_cost && <Text style={styles.cost}>Est: AED {parseFloat(item.estimated_cost).toFixed(0)}</Text>}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('WorkOrderCreate')}>
        <Text style={styles.createBtnText}>+ New Work Order</Text>
      </TouchableOpacity>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No work orders</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createBtn: { backgroundColor: Colors.primary, margin: 16, padding: 14, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  blocking: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  woNumber: { fontWeight: '700', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  vehicle: { fontSize: 13, color: '#333', marginBottom: 2 },
  type: { fontSize: 12, color: '#666' },
  blockingLabel: { color: '#F44336', fontWeight: '700', fontSize: 11, marginTop: 4 },
  cost: { fontSize: 12, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

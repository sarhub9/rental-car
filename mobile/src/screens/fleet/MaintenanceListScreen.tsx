import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.28:3000/v1').replace(/\/v1\/?$/, '');

const STATUS_COLORS: Record<string, string> = {
  open: '#FF9800', in_progress: '#2196F3', completed: '#4CAF50', cancelled: '#9E9E9E',
};

const MaintenanceListScreen: React.FC<any> = ({ navigation }: any) => {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'overdue' | 'all'>('active');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [ordersRes, overdueRes] = await Promise.all([
        fetch(`${API_URL}/v1/maintenance${tab === 'active' ? '?status=open' : ''}`, { headers }),
        fetch(`${API_URL}/v1/maintenance/overdue`, { headers }),
      ]);
      const ordersData = await ordersRes.json();
      const overdueData = await overdueRes.json();
      if (ordersData.success) setOrders(ordersData.data);
      if (overdueData.success) setOverdue(overdueData.data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('WorkOrderDetail', { workOrderId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.woNumber}>{item.work_order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.vehicle}>{item.make} {item.vehicle_model} ({item.plate_number})</Text>
      <Text style={styles.detail}>{item.type} — {item.description?.substring(0, 60)}</Text>
      {item.estimated_cost && <Text style={styles.cost}>Est: AED {parseFloat(item.estimated_cost).toFixed(2)}</Text>}
    </TouchableOpacity>
  );

  const renderOverdue = ({ item }: { item: any }) => (
    <View style={[styles.card, styles.overdueCard]}>
      <Text style={styles.woNumber}>{item.make} {item.model} ({item.plate_number})</Text>
      <Text style={styles.overdueText}>
        {item.next_maintenance_km ? `Overdue at ${item.next_maintenance_km} KM (current: ${item.current_odometer})` : ''}
        {item.next_maintenance_date ? `Due: ${new Date(item.next_maintenance_date).toLocaleDateString()}` : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['active', 'overdue', 'all'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Active' : t === 'overdue' ? `Overdue (${overdue.length})` : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'overdue' ? (
        <FlatList data={overdue} keyExtractor={item => item.id} renderItem={renderOverdue}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
          ListEmptyComponent={<Text style={styles.empty}>No overdue vehicles</Text>} />
      ) : (
        <FlatList data={orders} keyExtractor={item => item.id} renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
          ListEmptyComponent={<Text style={styles.empty}>No work orders</Text>} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF9800' },
  tabText: { fontSize: 13, color: '#777', fontWeight: '600' },
  tabTextActive: { color: '#FF9800' },
  card: { backgroundColor: '#fff', margin: 8, marginBottom: 0, padding: 14, borderRadius: 8, elevation: 1 },
  overdueCard: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  woNumber: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  vehicle: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 2 },
  detail: { fontSize: 12, color: '#777' },
  cost: { fontSize: 12, color: '#555', marginTop: 4 },
  overdueText: { fontSize: 12, color: '#F44336', fontWeight: '600', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
});

export default MaintenanceListScreen;

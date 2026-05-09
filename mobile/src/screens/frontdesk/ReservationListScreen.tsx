import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReservationApiService from '../../services/reservation-api.service';
import { Colors } from '../../theme';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#888',
  CONFIRMED: Colors.primary,
  ASSIGNED: '#2196F3',
  CHECKED_OUT: '#4CAF50',
  CANCELLED: '#F44336',
  NO_SHOW: '#FF9800',
};

export default function ReservationListScreen() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const loadReservations = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (filterStatus) params.status = filterStatus;
      const res = await ReservationApiService.listReservations(params);
      setReservations(res.data || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReservationDetail', { reservationId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.reservationNumber}>{item.reservation_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customer_name}</Text>
      <Text style={styles.dates}>
        {new Date(item.pickup_datetime).toLocaleDateString()} → {new Date(item.return_datetime).toLocaleDateString()}
      </Text>
      {item.plate_number && <Text style={styles.vehicle}>{item.make} {item.model} • {item.plate_number}</Text>}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('ReservationCreate')}
      >
        <Text style={styles.createBtnText}>+ New Reservation</Text>
      </TouchableOpacity>
      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReservations(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No reservations found</Text>}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reservationNumber: { fontWeight: '700', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  customerName: { fontSize: 14, color: '#333', marginBottom: 4 },
  dates: { fontSize: 12, color: '#666', marginBottom: 2 },
  vehicle: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

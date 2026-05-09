import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ReservationApiService from '../../services/reservation-api.service';
import { Colors } from '../../theme';

export default function ReservationDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservationId } = route.params;

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadReservation(); }, []);

  const loadReservation = async () => {
    try {
      const res = await ReservationApiService.getReservation(reservationId);
      setReservation(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, params?: any) => {
    setActionLoading(true);
    try {
      let result;
      switch (action) {
        case 'confirm':
          result = await ReservationApiService.confirmReservation(reservationId);
          break;
        case 'cancel':
          result = await ReservationApiService.cancelReservation(reservationId, params?.reason || 'Customer request');
          break;
        case 'no-show':
          result = await ReservationApiService.markNoShow(reservationId);
          break;
        default:
          return;
      }
      setReservation(result.data);
      Alert.alert('Success', `Reservation ${action} successful`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;
  if (!reservation) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Reservation not found</Text>;

  const r = reservation;
  const isEditable = ['DRAFT', 'CONFIRMED'].includes(r.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.number}>{r.reservation_number}</Text>
        <View style={[styles.badge, { backgroundColor: r.status === 'CONFIRMED' ? Colors.primary : r.status === 'CANCELLED' ? '#F44336' : '#888' }]}>
          <Text style={styles.badgeText}>{r.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.value}>{r.customer_name}</Text>
        <Text style={styles.subValue}>{r.customer_phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <Text style={styles.value}>Pickup: {new Date(r.pickup_datetime).toLocaleString()}</Text>
        <Text style={styles.value}>Return: {new Date(r.return_datetime).toLocaleString()}</Text>
      </View>

      {r.plate_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <Text style={styles.value}>{r.make} {r.model} • {r.plate_number}</Text>
        </View>
      )}

      {r.estimated_amount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Amount</Text>
          <Text style={styles.value}>AED {parseFloat(r.estimated_amount).toFixed(2)}</Text>
        </View>
      )}

      {r.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.value}>{r.notes}</Text>
        </View>
      )}

      {isEditable && (
        <View style={styles.actions}>
          {r.status === 'DRAFT' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleAction('confirm')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>Confirm Reservation</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
            onPress={() => Alert.prompt('Cancel Reason', '', reason => handleAction('cancel', { reason }))}
            disabled={actionLoading}
          >
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
          {r.status === 'CONFIRMED' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
              onPress={() => handleAction('no-show')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>Mark No-Show</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  number: { fontSize: 20, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  badgeText: { color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  subValue: { fontSize: 13, color: '#666' },
  actions: { marginTop: 8 },
  actionBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

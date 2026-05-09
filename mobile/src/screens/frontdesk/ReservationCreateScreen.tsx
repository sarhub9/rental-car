import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReservationApiService from '../../services/reservation-api.service';
import { Colors } from '../../theme';

export default function ReservationCreateScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    pickup_datetime: '',
    return_datetime: '',
    vehicle_id: '',
    notes: '',
    source: 'COUNTER',
    deposit_required: false,
  });

  const handleCreate = async () => {
    if (!form.customer_id || !form.pickup_datetime || !form.return_datetime) {
      Alert.alert('Validation', 'Customer, pickup date and return date are required');
      return;
    }

    setLoading(true);
    try {
      const result = await ReservationApiService.createReservation(form);
      Alert.alert('Success', `Reservation ${result.data.reservation_number} created`, [
        { text: 'View', onPress: () => navigation.replace('ReservationDetail', { reservationId: result.data.id }) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Customer ID *</Text>
      <TextInput
        style={styles.input}
        value={form.customer_id}
        onChangeText={v => setForm(f => ({ ...f, customer_id: v }))}
        placeholder="Customer UUID"
      />

      <Text style={styles.label}>Pickup Date/Time * (ISO format)</Text>
      <TextInput
        style={styles.input}
        value={form.pickup_datetime}
        onChangeText={v => setForm(f => ({ ...f, pickup_datetime: v }))}
        placeholder="2026-03-01T10:00:00Z"
      />

      <Text style={styles.label}>Return Date/Time *</Text>
      <TextInput
        style={styles.input}
        value={form.return_datetime}
        onChangeText={v => setForm(f => ({ ...f, return_datetime: v }))}
        placeholder="2026-03-08T10:00:00Z"
      />

      <Text style={styles.label}>Vehicle ID (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.vehicle_id}
        onChangeText={v => setForm(f => ({ ...f, vehicle_id: v }))}
        placeholder="Vehicle UUID (or leave empty for class booking)"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={form.notes}
        onChangeText={v => setForm(f => ({ ...f, notes: v }))}
        multiline
        placeholder="Optional notes"
      />

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Reservation</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: { fontWeight: '600', marginBottom: 4, color: '#444' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

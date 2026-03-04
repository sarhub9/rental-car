import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.28:3000/v1').replace(/\/v1\/?$/, '');

const WorkOrderDetailScreen: React.FC<any> = ({ route, navigation }: any) => {
  const { workOrderId } = route.params;
  const { accessToken } = useAuth();
  const [wo, setWo] = useState<any>(null);
  const [actualCost, setActualCost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [workOrderId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/v1/maintenance/${workOrderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) setWo(data.data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, body = {}) => {
    try {
      const res = await fetch(`${API_URL}/v1/maintenance/${workOrderId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { fetchDetail(); Alert.alert('Success', `Work order ${action}ed`); }
      else Alert.alert('Error', data.error || 'Action failed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (!wo) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.woNumber}>{wo.work_order_number}</Text>
        <Text style={styles.status}>{wo.status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <Text style={styles.value}>{wo.make} {wo.vehicle_model} ({wo.plate_number})</Text>
        <Text style={styles.label}>{wo.vehicle_number}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.label}>Type: <Text style={styles.value}>{wo.type}</Text></Text>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{wo.description}</Text>
        {wo.scheduled_date && <Text style={styles.label}>Scheduled: {new Date(wo.scheduled_date).toLocaleDateString()}</Text>}
        {wo.estimated_cost && <Text style={styles.label}>Estimated Cost: AED {parseFloat(wo.estimated_cost).toFixed(2)}</Text>}
        {wo.actual_cost && <Text style={styles.label}>Actual Cost: AED {parseFloat(wo.actual_cost).toFixed(2)}</Text>}
        {wo.downtime_days > 0 && <Text style={styles.label}>Downtime: {wo.downtime_days} days</Text>}
      </View>

      {wo.status === 'open' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
          onPress={() => handleAction('start')}>
          <Text style={styles.actionText}>Start Work</Text>
        </TouchableOpacity>
      )}

      {wo.status === 'in_progress' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complete Work Order</Text>
          <TextInput style={styles.input} placeholder="Actual cost (AED)" keyboardType="numeric"
            value={actualCost} onChangeText={setActualCost} />
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleAction('complete', { actual_cost: parseFloat(actualCost) || 0 })}>
            <Text style={styles.actionText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {['open', 'in_progress'].includes(wo.status) && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#757575', marginTop: 8 }]}
          onPress={() => Alert.alert('Cancel Work Order', 'Are you sure?', [
            { text: 'No' },
            { text: 'Yes', style: 'destructive', onPress: () => handleAction('cancel', { reason: 'Cancelled by user' }) },
          ])}>
          <Text style={styles.actionText}>Cancel Work Order</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  woNumber: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  status: { fontSize: 14, fontWeight: '700', color: '#FF9800' },
  section: { backgroundColor: '#fff', margin: 8, padding: 16, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  label: { fontSize: 13, color: '#777', marginBottom: 4 },
  value: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  actionBtn: { margin: 8, padding: 14, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
});

export default WorkOrderDetailScreen;

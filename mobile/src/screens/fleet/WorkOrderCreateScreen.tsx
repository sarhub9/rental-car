import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WorkOrderApiService from '../../services/work-order-api.service';
import { Colors } from '../../theme';

const MAINTENANCE_TYPES = [
  'OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_SERVICE', 'AC_SERVICE',
  'MAJOR_SERVICE', 'INSPECTION', 'BODY_REPAIR', 'OTHER',
];

export default function WorkOrderCreateScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    maintenance_type: 'OIL_CHANGE',
    description: '',
    vendor_name: '',
    estimated_cost: '',
    blocks_rental: false,
    priority: 'NORMAL',
  });

  const handleCreate = async () => {
    if (!form.vehicle_id || !form.description) {
      Alert.alert('Validation', 'Vehicle ID and description are required');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
      };
      const res = await WorkOrderApiService.createWorkOrder(data);
      Alert.alert('Created', `Work Order ${res.data.work_order_number} created`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Vehicle ID *</Text>
      <TextInput style={styles.input} value={form.vehicle_id} onChangeText={v => setForm(f => ({ ...f, vehicle_id: v }))} placeholder="Vehicle UUID" />

      <Text style={styles.label}>Maintenance Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {MAINTENANCE_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, form.maintenance_type === t && styles.typeChipActive]}
            onPress={() => setForm(f => ({ ...f, maintenance_type: t }))}
          >
            <Text style={[styles.typeChipText, form.maintenance_type === t && styles.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={form.description}
        onChangeText={v => setForm(f => ({ ...f, description: v }))}
        multiline
        placeholder="Describe the work to be done"
      />

      <Text style={styles.label}>Vendor Name</Text>
      <TextInput style={styles.input} value={form.vendor_name} onChangeText={v => setForm(f => ({ ...f, vendor_name: v }))} placeholder="Optional" />

      <Text style={styles.label}>Estimated Cost (AED)</Text>
      <TextInput
        style={styles.input}
        value={form.estimated_cost}
        onChangeText={v => setForm(f => ({ ...f, estimated_cost: v }))}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Blocks Rental?</Text>
        <Switch
          value={form.blocks_rental}
          onValueChange={v => setForm(f => ({ ...f, blocks_rental: v }))}
          trackColor={{ true: '#F44336' }}
        />
      </View>
      {form.blocks_rental && <Text style={{ color: '#F44336', marginBottom: 12, fontSize: 12 }}>Vehicle will be unavailable for rental until WO is COMPLETE/CANCELLED</Text>}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Work Order</Text>}
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8 },
  typeChipActive: { backgroundColor: Colors.primary },
  typeChipText: { fontSize: 11, color: '#555' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
});

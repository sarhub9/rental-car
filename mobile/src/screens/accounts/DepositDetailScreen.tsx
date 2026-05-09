import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import DepositApiService from '../../services/deposit-api.service';
import { Colors } from '../../theme';

export default function DepositDetailScreen() {
  const route = useRoute<any>();
  const { depositId } = route.params;
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadDeposit(); }, []);

  const loadDeposit = async () => {
    try {
      const res = await DepositApiService.getDeposit(depositId);
      setDeposit(res.data);
    } catch { Alert.alert('Error', 'Failed to load deposit'); }
    finally { setLoading(false); }
  };

  const handleRelease = () => {
    Alert.alert('Release Deposit', 'Are you sure you want to release this deposit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release', onPress: async () => {
          setActionLoading(true);
          try {
            const res = await DepositApiService.releaseDeposit(depositId, 'Rental completed');
            setDeposit(res.data);
            Alert.alert('Success', 'Deposit released');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to release');
          } finally { setActionLoading(false); }
        }
      },
    ]);
  };

  const handleForfeit = () => {
    Alert.alert('Forfeit Deposit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Forfeit', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            const res = await DepositApiService.forfeitDeposit(depositId, 'Damage/outstanding charges');
            setDeposit(res.data);
            Alert.alert('Forfeited', 'Deposit forfeited');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to forfeit');
          } finally { setActionLoading(false); }
        }
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;
  if (!deposit) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Deposit not found</Text>;

  const d = deposit;
  const canAct = ['HELD', 'PARTIALLY_USED'].includes(d.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.number}>{d.deposit_number}</Text>
        <Text style={[styles.status, { color: d.status === 'RELEASED' ? '#4CAF50' : d.status === 'FORFEITED' ? '#F44336' : Colors.primary }]}>{d.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.value}>{d.customer_name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agreement</Text>
        <Text style={styles.value}>{d.agreement_number}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deposit Amount</Text>
        <Text style={[styles.value, { fontSize: 20, fontWeight: '700' }]}>AED {parseFloat(d.amount).toFixed(2)}</Text>
        <Text style={styles.sub}>Payment: {d.payment_method}</Text>
        {d.transaction_reference && <Text style={styles.sub}>Ref: {d.transaction_reference}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <Text style={styles.value}>Amount Used: AED {parseFloat(d.amount_used).toFixed(2)}</Text>
        <Text style={styles.value}>Amount Released: AED {parseFloat(d.amount_released).toFixed(2)}</Text>
        <Text style={styles.value}>Remaining: AED {(parseFloat(d.amount) - parseFloat(d.amount_used) - parseFloat(d.amount_released)).toFixed(2)}</Text>
      </View>

      {canAct && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={handleRelease} disabled={actionLoading}>
            <Text style={styles.actionBtnText}>Release Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F44336' }]} onPress={handleForfeit} disabled={actionLoading}>
            <Text style={styles.actionBtnText}>Forfeit Deposit</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  number: { fontSize: 18, fontWeight: '700' },
  status: { fontWeight: '700', fontSize: 16 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 14, color: '#333' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { marginTop: 8 },
  actionBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

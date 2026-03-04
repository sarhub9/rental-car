import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import DepositStatusBadge from '../../components/DepositStatusBadge';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.28:3000/v1').replace(/\/v1\/?$/, '');

const FILTER_OPTIONS = ['ALL', 'HELD', 'RELEASED', 'USED', 'FORFEITED', 'REFUNDED'];

const DepositListScreen: React.FC<any> = () => {
  const { accessToken } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL' ? `${API_URL}/v1/deposits` : `${API_URL}/v1/deposits?status=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (data.success) setDeposits(data.data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const handleAction = async (id: string, action: string, body = {}) => {
    try {
      const res = await fetch(`${API_URL}/v1/deposits/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) fetchDeposits();
      else Alert.alert('Error', data.error || 'Action failed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderDeposit = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.agreementNum}>{item.agreement_number || 'N/A'}</Text>
        <DepositStatusBadge status={item.status} amount={parseFloat(item.amount)} />
      </View>
      <Text style={styles.customer}>{item.customer_name}</Text>
      <Text style={styles.detail}>Collected: {item.collected_at ? new Date(item.collected_at).toLocaleDateString() : '-'}</Text>
      {item.release_eligible_at && (
        <Text style={styles.detail}>Release eligible: {new Date(item.release_eligible_at).toLocaleDateString()}</Text>
      )}
      <View style={styles.actions}>
        {item.status === 'HELD' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnRelease]} onPress={() => handleAction(item.id, 'release')}>
              <Text style={styles.btnText}>Release</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnForfeit]} onPress={() =>
              Alert.alert('Forfeit Deposit', 'Enter justification', [
                { text: 'Cancel' },
                { text: 'Forfeit', style: 'destructive', onPress: () => handleAction(item.id, 'forfeit', { justification: 'Manual forfeit' }) },
              ])
            }>
              <Text style={styles.btnText}>Forfeit</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'RELEASED' && (
          <TouchableOpacity style={[styles.btn, styles.btnRefund]} onPress={() => handleAction(item.id, 'refund')}>
            <Text style={styles.btnText}>Refund</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={deposits}
        keyExtractor={item => item.id}
        renderItem={renderDeposit}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDeposits} />}
        ListEmptyComponent={<Text style={styles.empty}>No deposits found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterRow: { flexDirection: 'row', padding: 8, flexWrap: 'wrap', gap: 4 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e0e0e0' },
  filterActive: { backgroundColor: '#7B1FA2' },
  filterText: { fontSize: 11, color: '#333', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', margin: 8, marginBottom: 0, padding: 14, borderRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  agreementNum: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  customer: { fontSize: 13, color: '#555', marginBottom: 4 },
  detail: { fontSize: 12, color: '#777' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnRelease: { backgroundColor: '#4CAF50' },
  btnForfeit: { backgroundColor: '#757575' },
  btnRefund: { backgroundColor: '#1976D2' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
});

export default DepositListScreen;

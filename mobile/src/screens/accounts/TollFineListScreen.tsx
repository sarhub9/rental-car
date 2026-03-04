import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.28:3000/v1').replace(/\/v1\/?$/, '');

const STATUS_COLORS: Record<string, string> = {
  matched: '#4CAF50', unmatched: '#F44336', pending: '#FF9800', manual: '#2196F3',
};

const TollFineListScreen: React.FC<any> = () => {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'unmatched'>('all');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const url = tab === 'unmatched' ? `${API_URL}/v1/toll-fines/unmatched` : `${API_URL}/v1/toll-fines`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const renderEvent = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.plate}>{item.plate_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.attribution_status] || '#999' }]}>
          <Text style={styles.statusText}>{item.attribution_status}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.type}>{item.event_type.toUpperCase()}</Text>
        <Text style={styles.amount}>AED {parseFloat(item.amount).toFixed(2)}</Text>
      </View>
      <Text style={styles.detail}>{new Date(item.event_timestamp).toLocaleString()}</Text>
      {item.location && <Text style={styles.detail}>{item.location}</Text>}
      {item.agreement_number && <Text style={styles.matched}>Matched: {item.agreement_number}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'unmatched' && styles.tabActive]} onPress={() => setTab('unmatched')}>
          <Text style={[styles.tabText, tab === 'unmatched' && styles.tabTextActive]}>Unmatched Queue</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEvents} />}
        ListEmptyComponent={<Text style={styles.empty}>No events found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7B1FA2' },
  tabText: { fontSize: 14, color: '#777', fontWeight: '600' },
  tabTextActive: { color: '#7B1FA2' },
  card: { backgroundColor: '#fff', margin: 8, marginBottom: 0, padding: 14, borderRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  plate: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  type: { fontSize: 13, fontWeight: '600', color: '#555' },
  amount: { fontSize: 14, fontWeight: '700', color: '#d32f2f' },
  detail: { fontSize: 12, color: '#777' },
  matched: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginTop: 4 },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
});

export default TollFineListScreen;

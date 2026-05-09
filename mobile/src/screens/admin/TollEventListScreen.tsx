import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TollEventApiService from '../../services/toll-event-api.service';
import { Colors } from '../../theme';

const STATUS_COLORS: Record<string, string> = {
  UNATTRIBUTED: '#FF9800',
  ATTRIBUTED: '#4CAF50',
  CONFLICT: '#F44336',
  UNRESOLVABLE: '#888',
  WAIVED: '#9E9E9E',
};

export default function TollEventListScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eventsRes, summaryRes] = await Promise.all([
        TollEventApiService.listEvents({ limit: 50 }),
        TollEventApiService.getSummary(),
      ]);
      setEvents(eventsRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load toll events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TollEventDetail', { eventId: item.id })}
    >
      <View style={styles.row}>
        <Text style={styles.plate}>{item.plate_number}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.attribution_status] || '#888' }]}>
          <Text style={styles.badgeText}>{item.attribution_status}</Text>
        </View>
      </View>
      <Text style={styles.type}>{item.event_type} • {new Date(item.event_datetime).toLocaleDateString()}</Text>
      <Text style={styles.amount}>AED {parseFloat(item.total_amount).toFixed(2)}</Text>
      {item.conflict_notes && <Text style={styles.conflict}>{item.conflict_notes}</Text>}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={styles.container}>
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Unattributed: {summary.unattributed_count} (AED {parseFloat(summary.unattributed_total || 0).toFixed(0)})</Text>
          <Text style={styles.summaryText}>Conflicts: {summary.conflict_count} (AED {parseFloat(summary.conflict_total || 0).toFixed(0)})</Text>
        </View>
      )}
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No toll/fine events</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  summaryCard: { backgroundColor: '#FFF3E0', margin: 16, padding: 12, borderRadius: 8 },
  summaryText: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  plate: { fontWeight: '700', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  type: { fontSize: 12, color: '#666', marginBottom: 2 },
  amount: { fontWeight: '700', color: Colors.primary },
  conflict: { fontSize: 11, color: '#F44336', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

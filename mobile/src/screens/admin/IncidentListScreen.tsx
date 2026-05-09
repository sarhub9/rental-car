import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/api-client';
import { Colors } from '../../theme';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#FF9800',
  UNDER_REVIEW: '#2196F3',
  CLAIMED: '#9C27B0',
  SETTLED: '#4CAF50',
  CLOSED: '#888',
  REJECTED: '#F44336',
};

export default function IncidentListScreen() {
  const navigation = useNavigation<any>();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/incidents', { params: { limit: 50 } });
      setIncidents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
    >
      <View style={styles.row}>
        <Text style={styles.number}>{item.incident_number}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.type}>{item.incident_type} • {item.customer_name}</Text>
      <Text style={styles.vehicle}>{item.make} {item.model} • {item.plate_number}</Text>
      <Text style={styles.date}>{new Date(item.incident_datetime).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={incidents}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No incidents reported</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  number: { fontWeight: '700', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  type: { fontSize: 13, color: '#333', marginBottom: 2 },
  vehicle: { fontSize: 12, color: '#666', marginBottom: 2 },
  date: { fontSize: 11, color: '#999' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

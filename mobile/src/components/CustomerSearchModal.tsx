import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import customerApiService from '../services/customer-api.service';
import { Colors, Spacing, Typography } from '../theme';
import type { Customer } from '../types';

interface Props {
  visible: boolean;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerSearchModal: React.FC<Props> = ({ visible, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimer) clearTimeout(searchTimer);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const customers = await customerApiService.searchCustomers(text);
        setResults(customers);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    setSearchTimer(timer);
  }, [searchTimer]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setQuery('');
    setResults([]);
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.full_name_en}</Text>
        <Text style={styles.itemBadge}>{item.customer_type}</Text>
      </View>
      <Text style={styles.itemDetail}>{item.phone_number}</Text>
      {item.email && <Text style={styles.itemDetail}>{item.email}</Text>}
      <Text style={styles.itemDetail}>License: {item.driving_license_number}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Customer</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email, or license..."
          value={query}
          onChangeText={handleSearch}
          autoFocus
          placeholderTextColor={Colors.textLight}
        />

        {loading && <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />}

        <FlatList
          data={results}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <Text style={styles.emptyText}>No customers found</Text>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textGold },
  closeBtn: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  searchInput: {
    margin: Spacing.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    fontSize: 16, color: Colors.textDark, backgroundColor: Colors.surface,
  },
  loader: { marginVertical: Spacing.md },
  item: {
    padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.textDark },
  itemBadge: {
    fontSize: 12, color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  itemDetail: { fontSize: 14, color: Colors.textSecondary },
  emptyText: {
    textAlign: 'center', color: Colors.textSecondary,
    marginTop: Spacing.xl, fontSize: 16,
  },
});

export default CustomerSearchModal;

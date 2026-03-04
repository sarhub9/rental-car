import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';
import { OwnerAdminStackParamList, StaffUser } from '../../types';

type NavProp = NativeStackNavigationProp<OwnerAdminStackParamList>;

const ROLE_TABS = ['ALL', 'OWNER_ADMIN', 'FRONT_DESK', 'FLEET_MANAGER', 'ACCOUNTS', 'DRIVER_RECOVERY'];

const UserListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const loadUsers = useCallback(async () => {
    try {
      const filters: any = {};
      if (activeTab !== 'ALL') filters.role = activeTab;
      const result = await AdminApiService.listUsers(filters);
      setUsers(result);
    } catch (err) {
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.includes(q)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return Colors.success;
      case 'INACTIVE': return Colors.textLight;
      case 'LOCKED': return Colors.error;
      default: return Colors.textLight;
    }
  };

  const renderUser = ({ item }: { item: StaffUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserEdit', { userId: item.id })}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.full_name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge]}>
            <Text style={styles.roleText}>{item.role.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, email, or phone..."
        placeholderTextColor={Colors.textLight}
      />

      {/* Role tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={ROLE_TABS}
        keyExtractor={(item) => item}
        style={styles.tabBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item && styles.tabActive]}
            onPress={() => setActiveTab(item)}
          >
            <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>
              {item === 'ALL' ? 'All' : item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UserCreate')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    margin: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },
  tabBar: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, maxHeight: 44 },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round, marginRight: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.caption, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textWhite },
  userCard: {
    flexDirection: 'row', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  avatarText: { ...Typography.h3, color: Colors.textWhite },
  userInfo: { flex: 1 },
  userName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  userEmail: { ...Typography.bodySmall, color: Colors.textSecondary },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  roleBadge: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, marginRight: Spacing.sm,
  },
  roleText: { ...Typography.caption, color: Colors.textSecondary },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { ...Typography.caption },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.xl },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: Colors.textWhite, lineHeight: 30 },
});

export default UserListScreen;

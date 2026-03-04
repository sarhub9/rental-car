import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList, Agreement, CheckoutEvidence, ReturnEvidence, Charge } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type RouteType = RouteProp<CustomerStackParamList, 'AgreementDetail'>;

const CustomerAgreementDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const { agreementId } = route.params;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [evidence, setEvidence] = useState<{ checkout?: CheckoutEvidence; return?: ReturnEvidence } | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [agreementData, evidenceData, chargesData] = await Promise.all([
        CustomerPortalApiService.getAgreementDetail(agreementId),
        CustomerPortalApiService.getAgreementEvidence(agreementId).catch(() => null),
        CustomerPortalApiService.getAgreementCharges(agreementId).catch(() => []),
      ]);
      setAgreement(agreementData);
      setEvidence(evidenceData);
      setCharges(chargesData || []);
    } catch (err) {
      console.error('Failed to load agreement detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agreementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const statusColor = {
    DRAFT: Colors.statusDraft,
    ACTIVE: Colors.statusActive,
    CLOSED: Colors.statusClosed,
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!agreement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Agreement not found</Text>
      </View>
    );
  }

  const totalCharges = charges.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor[agreement.status] }]}>
        <Text style={styles.statusBannerText}>{agreement.status}</Text>
      </View>

      {/* Agreement Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agreement Details</Text>
        <DetailRow label="Agreement #" value={agreement.agreement_number} />
        <DetailRow
          label="Rental Period"
          value={`${new Date(agreement.rental_start_datetime).toLocaleDateString()} - ${new Date(agreement.rental_end_datetime).toLocaleDateString()}`}
        />
        <DetailRow label="Daily Rate" value={agreement.daily_rate ? `AED ${agreement.daily_rate}` : '-'} />
        <DetailRow label="Weekly Rate" value={agreement.weekly_rate ? `AED ${agreement.weekly_rate}` : '-'} />
        <DetailRow label="Estimated Amount" value={`AED ${Number(agreement.estimated_amount || 0).toFixed(2)}`} />
        {agreement.actual_amount != null ? (
          <DetailRow
            label="Final Amount"
            value={`AED ${Number(agreement.actual_amount).toFixed(2)}`}
            highlight
          />
        ) : null}
      </View>

      {/* Checkout Evidence */}
      {evidence?.checkout ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkout Details</Text>
          <DetailRow label="Odometer" value={`${evidence.checkout.odometer_reading} km`} />
          <DetailRow label="Fuel Level" value={evidence.checkout.fuel_level} />
          <DetailRow label="Date" value={new Date(evidence.checkout.captured_at).toLocaleString()} />
          {evidence.checkout.accessories && evidence.checkout.accessories.length > 0 ? (
            <DetailRow label="Accessories" value={evidence.checkout.accessories.join(', ')} />
          ) : null}
          {evidence.checkout.photos && evidence.checkout.photos.length > 0 ? (
            <Text style={styles.photoCount}>
              {evidence.checkout.photos.length} checkout photo(s) captured
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Return Evidence */}
      {evidence?.return ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Details</Text>
          <DetailRow label="Odometer" value={`${evidence.return.odometer_reading} km`} />
          <DetailRow label="Fuel Level" value={evidence.return.fuel_level} />
          <DetailRow label="KM Driven" value={`${evidence.return.kilometers_driven} km`} />
          <DetailRow label="Damage" value={evidence.return.damage_documented ? 'Yes' : 'No'} />
          {evidence.return.damage_description ? (
            <DetailRow label="Damage Details" value={evidence.return.damage_description} />
          ) : null}
          <DetailRow label="Date" value={new Date(evidence.return.captured_at).toLocaleString()} />
          {evidence.return.photos && evidence.return.photos.length > 0 ? (
            <Text style={styles.photoCount}>
              {evidence.return.photos.length} return photo(s) captured
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Charges */}
      {charges.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges</Text>
          {charges.map((charge) => (
            <View key={charge.id} style={styles.chargeRow}>
              <View style={styles.chargeInfo}>
                <Text style={styles.chargeType}>{formatChargeType(charge.charge_type)}</Text>
                <Text style={styles.chargeStatus}>{charge.approval_status}</Text>
              </View>
              <Text style={styles.chargeAmount}>AED {Number(charge.amount).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Charges</Text>
            <Text style={styles.totalAmount}>AED {Number(totalCharges).toFixed(2)}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const DetailRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, highlight && styles.detailHighlight]}>{value}</Text>
  </View>
);

const formatChargeType = (type: string): string => {
  const labels: Record<string, string> = {
    EXTRA_KM: 'Extra Kilometers',
    FUEL: 'Fuel Charge',
    LATE_FEE: 'Late Return Fee',
    DAMAGE: 'Damage Charge',
  };
  return labels[type] || type;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...Typography.body, color: Colors.error },
  statusBanner: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  statusBannerText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  section: {
    backgroundColor: Colors.background,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  detailValue: { ...Typography.bodySmall, color: Colors.text, flex: 1, textAlign: 'right' },
  detailHighlight: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
  photoCount: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  chargeInfo: { flex: 1 },
  chargeType: { ...Typography.body, color: Colors.text },
  chargeStatus: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },
  chargeAmount: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalAmount: { ...Typography.h3, color: Colors.primary },
});

export default CustomerAgreementDetailScreen;

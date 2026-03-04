import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import agreementApiService from '../services/agreement-api.service';
import customerApiService from '../services/customer-api.service';
import vehicleApiService from '../services/vehicle-api.service';
import { API_BASE_URL } from '../services/api-client';
import ChargeBreakdown from '../components/ChargeBreakdown';
import PhotoGallery from '../components/PhotoGallery';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import type { Customer, Vehicle } from '../types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT': return Colors.statusDraft;
    case 'ACTIVE': return Colors.statusActive;
    case 'CLOSED': return Colors.statusClosed;
    default: return Colors.text;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'file-edit-outline';
    case 'ACTIVE': return 'check-circle';
    case 'CLOSED': return 'lock';
    default: return 'help-circle';
  }
};

const API_ORIGIN = API_BASE_URL.replace(/\/v1\/?$/, '');

const normalizeAssetUrl = (url?: string) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url
    .replace('http://localhost:3000', API_ORIGIN)
    .replace('http://127.0.0.1:3000', API_ORIGIN);
};

const normalizeEvidencePhotos = (ev: any) => {
  if (!ev) return ev;
  return {
    ...ev,
    checkout: ev.checkout
      ? {
          ...ev.checkout,
          photos: (ev.checkout.photos || []).map((p: any) => ({
            ...p,
            photo_url: normalizeAssetUrl(p.photo_url),
            photo_thumbnail_url: normalizeAssetUrl(p.photo_thumbnail_url),
          })),
        }
      : null,
    return: ev.return
      ? {
          ...ev.return,
          photos: (ev.return.photos || []).map((p: any) => ({
            ...p,
            photo_url: normalizeAssetUrl(p.photo_url),
            photo_thumbnail_url: normalizeAssetUrl(p.photo_thumbnail_url),
          })),
        }
      : null,
  };
};

const AgreementViewScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { agreementId } = route.params;

  const [agreementData, setAgreementData] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (agreementId) loadData();
    else { setLoadError('No agreement ID provided'); setLoading(false); }
  }, [agreementId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const agrResponse = await agreementApiService.getAgreement(agreementId);
      const agr = agrResponse.data;
      if (!agr) { setLoadError('Agreement not found'); return; }
      setAgreementData(agr);
      if (agr.customer_id) customerApiService.getCustomer(agr.customer_id).then(setCustomer).catch(() => {});
      if (agr.vehicle_id) vehicleApiService.getVehicle(agr.vehicle_id).then(setVehicle).catch(() => {});
      agreementApiService.getEvidence(agreementId).then((res) => setEvidence(normalizeEvidencePhotos(res.data))).catch(() => {});
      agreementApiService.getCharges(agreementId).then((res) => setCharges(res.data || [])).catch(() => setCharges([]));
    } catch (error: any) {
      setLoadError(error.response?.data?.message || error.message || 'Failed to load agreement');
    } finally {
      setLoading(false);
    }
  };

  const agreement = agreementData;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.fdPrimary} />
        <Text style={styles.loadingText}>Loading agreement...</Text>
      </View>
    );
  }

  if (loadError || !agreement) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{loadError || 'Agreement not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={loadData}>
          <Ionicons name="refresh" size={18} color={Colors.textWhite} />
          <Text style={styles.retryBtnText}> Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(agreement.status);

  const bottomPad = Math.max(insets.bottom, 34) + 40;

  return (
    <View style={styles.safeArea}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: bottomPad }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusColor + '20' }]}>
            <MaterialCommunityIcons name={getStatusIcon(agreement.status) as any} size={24} color={statusColor} />
          </View>
          <View>
            <Text style={styles.agreementNumber}>{agreement.agreement_number}</Text>
            <Text style={styles.headerMeta}>
              {customer?.full_name_en || 'Customer'} | {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{agreement.status}</Text>
        </View>
      </View>

      {/* Customer */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="account" size={20} color={Colors.fdPrimary} />
          <Text style={styles.sectionTitle}> Customer</Text>
        </View>
        {customer ? (
          <>
            <DetailRow icon="account-outline" label="Name" value={customer.full_name_en} />
            <DetailRow icon="phone-outline" label="Phone" value={customer.phone_number} />
            <DetailRow icon="card-account-details-outline" label="License" value={customer.driving_license_number} />
            <DetailRow icon="tag-outline" label="Type" value={customer.customer_type} />
          </>
        ) : (
          <DetailRow icon="identifier" label="Customer ID" value={agreement.customer_id} />
        )}
      </View>

      {/* Vehicle */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="car" size={20} color={Colors.fdPrimary} />
          <Text style={styles.sectionTitle}> Vehicle</Text>
        </View>
        {vehicle ? (
          <>
            <DetailRow icon="car-outline" label="Vehicle" value={`${vehicle.make} ${vehicle.model} (${vehicle.year})`} />
            <DetailRow icon="card-text-outline" label="Plate" value={`${vehicle.plate_number} - ${vehicle.plate_emirate}`} />
            {vehicle.color && <DetailRow icon="palette-outline" label="Color" value={vehicle.color} />}
          </>
        ) : (
          <DetailRow icon="identifier" label="Vehicle ID" value={agreement.vehicle_id} />
        )}
      </View>

      {/* Rental Details */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="calendar-range" size={20} color={Colors.fdPrimary} />
          <Text style={styles.sectionTitle}> Rental Details</Text>
        </View>
        <DetailRow icon="calendar-start" label="Start" value={new Date(agreement.rental_start_datetime).toLocaleString()} />
        <DetailRow icon="calendar-end" label="End" value={new Date(agreement.rental_end_datetime).toLocaleString()} />
        {agreement.daily_rate && <DetailRow icon="cash" label="Daily Rate" value={`AED ${agreement.daily_rate}`} />}
        {agreement.weekly_rate && <DetailRow icon="cash-multiple" label="Weekly Rate" value={`AED ${agreement.weekly_rate}`} />}
        <DetailRow icon="calculator" label="Estimated" value={`AED ${Number(agreement.estimated_amount || 0).toFixed(2)}`} />
        {agreement.actual_amount != null && (
          <DetailRow icon="check-bold" label="Actual" value={`AED ${Number(agreement.actual_amount).toFixed(2)}`} highlight />
        )}
      </View>

      {/* Evidence Comparison */}
      {evidence?.checkout && evidence?.return && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="compare" size={20} color={Colors.fdPrimary} />
            <Text style={styles.sectionTitle}> Evidence Comparison</Text>
          </View>
          <View style={styles.compTable}>
            <View style={styles.compHeader}>
              <Text style={styles.compHeaderText}>Checkout</Text>
              <Text style={styles.compHeaderText}>Return</Text>
            </View>
            <CompRow label="Odometer" left={`${evidence.checkout.odometer_reading} km`} right={`${evidence.return.odometer_reading} km`} />
            <CompRow label="Fuel" left={evidence.checkout.fuel_level} right={evidence.return.fuel_level} />
            <CompRow label="KM Driven" left="-" right={`${evidence.return.kilometers_driven} km`} />
            <CompRow label="Photos" left={`${evidence.checkout.photos?.length || 0}`} right={`${evidence.return.photos?.length || 0}`} />
          </View>
        </View>
      )}

      {/* Checkout Evidence */}
      {evidence?.checkout && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="arrow-right-circle" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}> Checkout Evidence</Text>
          </View>
          <DetailRow icon="speedometer" label="Odometer" value={`${evidence.checkout.odometer_reading} km`} />
          <DetailRow icon="gas-station" label="Fuel Level" value={evidence.checkout.fuel_level} />
          {evidence.checkout.photos && <PhotoGallery photos={evidence.checkout.photos} title="Checkout Photos" />}
        </View>
      )}

      {/* Return Evidence */}
      {evidence?.return && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="arrow-left-circle" size={20} color={Colors.error} />
            <Text style={styles.sectionTitle}> Return Evidence</Text>
          </View>
          <DetailRow icon="speedometer" label="Odometer" value={`${evidence.return.odometer_reading} km`} />
          <DetailRow icon="gas-station" label="Fuel Level" value={evidence.return.fuel_level} />
          <DetailRow icon="road-variant" label="KM Driven" value={`${evidence.return.kilometers_driven} km`} />
          {evidence.return.damage_documented && (
            <DetailRow icon="car-wrench" label="Damage" value={evidence.return.damage_description} isError />
          )}
          {evidence.return.photos && <PhotoGallery photos={evidence.return.photos} title="Return Photos" />}
        </View>
      )}

      {/* Charges */}
      {charges.length > 0 && (
        <View style={styles.section}>
          <ChargeBreakdown charges={charges} />
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="timeline-clock" size={20} color={Colors.fdPrimary} />
          <Text style={styles.sectionTitle}> Timeline</Text>
        </View>
        <TimelineItem title="Agreement Created" date={agreement.created_at} icon="plus-circle" color={Colors.info} />
        {agreement.checkout_timestamp && (
          <TimelineItem title="Vehicle Checked Out" date={agreement.checkout_timestamp} icon="arrow-right-circle" color={Colors.success} />
        )}
        {agreement.return_timestamp && (
          <TimelineItem title="Vehicle Returned" date={agreement.return_timestamp} icon="arrow-left-circle" color={Colors.statusClosed} />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {agreement.status === 'DRAFT' && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.fdPrimary }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AgreementEdit', { agreementId })}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={Colors.textWhite} />
              <Text style={styles.actionBtnText}> Edit Agreement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.fdPrimaryDark }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Checkout', { agreementId })}
            >
              <MaterialCommunityIcons name="car-arrow-right" size={20} color={Colors.textWhite} />
              <Text style={[styles.actionBtnText, { color: Colors.textWhite }]}> Start Checkout</Text>
            </TouchableOpacity>
          </>
        )}
        {agreement.status === 'ACTIVE' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.fdPrimaryDark }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Return', { agreementId })}
          >
            <MaterialCommunityIcons name="car-arrow-left" size={20} color={Colors.textWhite} />
            <Text style={[styles.actionBtnText, { color: Colors.textWhite }]}> Process Return</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </View>
  );
};

const DetailRow = ({ icon, label, value, highlight = false, isError = false }: any) => (
  <View style={detailStyles.row}>
    <MaterialCommunityIcons name={icon || 'information-outline'} size={16} color={Colors.fdSecondary} style={{ marginRight: 6, marginTop: 2 }} />
    <Text style={detailStyles.label}>{label}</Text>
    <Text style={[
      detailStyles.value,
      highlight && detailStyles.highlight,
      isError && detailStyles.error,
    ]}>
      {value}
    </Text>
  </View>
);

const CompRow = ({ label, left, right }: { label: string; left: string; right: string }) => (
  <View style={compStyles.row}>
    <Text style={compStyles.label}>{label}</Text>
    <Text style={compStyles.value}>{left}</Text>
    <Text style={compStyles.value}>{right}</Text>
  </View>
);

const TimelineItem = ({ title, date, icon, color }: { title: string; date: string; icon: string; color: string }) => (
  <View style={timelineStyles.item}>
    <View style={[timelineStyles.dotWrap, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon as any} size={16} color={color} />
    </View>
    <View style={timelineStyles.content}>
      <Text style={timelineStyles.title}>{title}</Text>
      <Text style={timelineStyles.date}>{new Date(date).toLocaleString()}</Text>
    </View>
  </View>
);

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  label: { ...Typography.bodySmall, color: Colors.fdSecondary, flex: 1 },
  value: { ...Typography.bodySmall, color: Colors.fdPrimaryDark, fontWeight: '500', flex: 2, textAlign: 'right' },
  highlight: { fontSize: 14, fontWeight: '700', color: Colors.success },
  error: { color: Colors.error },
});

const compStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.fdPrimary + '20' },
  label: { flex: 1, ...Typography.bodySmall, color: Colors.fdSecondary },
  value: { flex: 1, ...Typography.bodySmall, textAlign: 'center', fontWeight: '500', color: Colors.fdPrimaryDark },
});

const timelineStyles = StyleSheet.create({
  item: { flexDirection: 'row', marginBottom: Spacing.lg, alignItems: 'flex-start' },
  dotWrap: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: { flex: 1 },
  title: { ...Typography.body, fontWeight: '700', color: Colors.fdPrimaryDark },
  date: { ...Typography.bodySmall, color: Colors.fdSecondary },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.fdBackground },
  container: { flex: 1, backgroundColor: Colors.fdBackground },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.fdBackground },
  loadingText: { marginTop: Spacing.lg, fontSize: 16, color: Colors.fdSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.fdBackground },
  errorText: { fontSize: 18, color: Colors.error, textAlign: 'center', marginVertical: Spacing.lg },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.fdPrimary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '700' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, backgroundColor: '#FFFFFF',
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '20',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  statusIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  agreementNumber: { ...Typography.h3, color: Colors.fdPrimaryDark, fontWeight: '700' },
  headerMeta: { ...Typography.bodySmall, color: Colors.fdSecondary },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.round, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  section: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '15',
    backgroundColor: '#FFFFFF',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.fdPrimaryDark },
  compTable: {
    backgroundColor: Colors.fdBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.fdPrimary + '20',
  },
  compHeader: {
    flexDirection: 'row', paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.fdPrimary + '20',
  },
  compHeaderText: { flex: 1, textAlign: 'center', ...Typography.label, color: Colors.fdPrimary },
  actions: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
  actionBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '700' },
});

export default AgreementViewScreen;

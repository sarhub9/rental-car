import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Charge {
  id: string;
  charge_type: string;
  amount: number;
  calculation_basis: Record<string, any>;
  approval_status: string;
}

interface Props {
  charges: Charge[];
}

const LABELS: Record<string, string> = {
  EXTRA_KM: 'Extra Kilometer Charge',
  FUEL: 'Fuel Charge',
  LATE_FEE: 'Late Return Fee',
  DAMAGE: 'Damage Charge',
};

function formatFormula(charge: Charge): string {
  const b = charge.calculation_basis;
  switch (charge.charge_type) {
    case 'EXTRA_KM':
      return `max(0, (${b.km_driven} - ${b.km_allowance})) × ${b.rate_per_km}`;
    case 'FUEL':
      return `(${b.checkout_fuel_level} - ${b.return_fuel_level}) × ${b.refill_rate}`;
    case 'LATE_FEE':
      return b.within_grace
        ? 'Within grace period'
        : `${b.hours_after_grace}h × ${b.rate_per_hour}/h${b.capped ? ' (capped)' : ''}`;
    case 'DAMAGE':
      return b.damage_description || 'Pending assessment';
    default:
      return JSON.stringify(b);
  }
}

const ChargeBreakdownDetail: React.FC<Props> = ({ charges }) => {
  const total = charges.reduce((sum, c) => sum + parseFloat(String(c.amount)), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Charge Breakdown</Text>
      {charges.length === 0 && (
        <Text style={styles.noCharges}>No additional charges</Text>
      )}
      {charges.map((charge) => (
        <View key={charge.id} style={styles.chargeRow}>
          <View style={styles.chargeHeader}>
            <Text style={styles.chargeType}>{LABELS[charge.charge_type] || charge.charge_type}</Text>
            <Text style={styles.chargeAmount}>AED {parseFloat(String(charge.amount)).toFixed(2)}</Text>
          </View>
          <Text style={styles.formula}>{formatFormula(charge)}</Text>
          {charge.approval_status === 'PENDING_APPROVAL' && (
            <Text style={styles.pending}>Pending Approval</Text>
          )}
        </View>
      ))}
      {charges.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Additional Charges</Text>
          <Text style={styles.totalAmount}>AED {total.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8, marginVertical: 8 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1a1a1a' },
  noCharges: { color: '#4CAF50', fontSize: 14, fontStyle: 'italic' },
  chargeRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  chargeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chargeType: { fontSize: 15, fontWeight: '600', color: '#333' },
  chargeAmount: { fontSize: 15, fontWeight: '700', color: '#d32f2f' },
  formula: { fontSize: 12, color: '#777', marginTop: 4, fontFamily: 'monospace' },
  pending: { fontSize: 12, color: '#FF9800', marginTop: 4, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#d32f2f' },
});

export default ChargeBreakdownDetail;

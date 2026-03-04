import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

/**
 * ChargeBreakdown Component
 * Displays auto-generated charges with calculation details
 */
const ChargeBreakdown = ({ charges }) => {
  const renderCharge = ({ item }) => {
    const basis = item.calculation_basis;

    return (
      <View style={styles.chargeItem}>
        <View style={styles.chargeHeader}>
          <Text style={styles.chargeType}>{item.charge_type.replace('_', ' ')}</Text>
          <Text style={styles.chargeAmount}>AED {Number(item.amount).toFixed(2)}</Text>
        </View>

        <View style={styles.chargeDetails}>
          {item.charge_type === 'EXTRA_KM' && (
            <>
              <Text style={styles.detailText}>
                Kilometers Driven: {basis.km_driven} km
              </Text>
              <Text style={styles.detailText}>
                Allowance: {basis.km_allowance} km
              </Text>
              <Text style={styles.detailText}>
                Extra: {basis.extra_km} km × AED {basis.rate_per_km}/km
              </Text>
            </>
          )}

          {item.charge_type === 'FUEL' && (
            <>
              <Text style={styles.detailText}>
                Checkout: {basis.checkout_fuel_level}
              </Text>
              <Text style={styles.detailText}>
                Return: {basis.return_fuel_level}
              </Text>
              <Text style={styles.detailText}>
                Refill: {(Number(basis.fuel_difference || 0) * 100).toFixed(0)}% × AED {basis.refill_rate}
              </Text>
            </>
          )}

          {item.charge_type === 'LATE_FEE' && (
            <>
              <Text style={styles.detailText}>
                Hours Late: {basis.hours_late}
              </Text>
              <Text style={styles.detailText}>
                Rate: AED {basis.rate_per_hour}/hour
              </Text>
            </>
          )}

          {item.charge_type === 'DAMAGE' && (
            <>
              <Text style={styles.detailText}>
                {basis.damage_description}
              </Text>
              <Text style={[styles.detailText, styles.pendingText]}>
                Status: {item.approval_status}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const totalAmount = charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Charge Breakdown</Text>

      <FlatList
        data={charges}
        renderItem={renderCharge}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Charges:</Text>
        <Text style={styles.totalAmount}>AED {totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  chargeItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chargeType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  chargeDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pendingText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
});

export default ChargeBreakdown;

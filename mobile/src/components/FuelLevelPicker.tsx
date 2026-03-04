import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { FUEL_LEVELS } from '../constants';
import type { FuelLevel } from '../types';

interface Props {
  value: FuelLevel;
  onChange: (level: FuelLevel) => void;
}

const FUEL_COLORS: Record<FuelLevel, string> = {
  EMPTY: Colors.fuelEmpty,
  QUARTER: Colors.fuelQuarter,
  HALF: Colors.fuelHalf,
  THREE_QUARTER: Colors.fuelThreeQuarter,
  FULL: Colors.fuelFull,
};

const FuelLevelPicker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel Level</Text>
      <View style={styles.gauge}>
        {FUEL_LEVELS.map((level) => {
          const isSelected = value === level.value;
          const isActive = FUEL_LEVELS.findIndex((l) => l.value === value)
            >= FUEL_LEVELS.findIndex((l) => l.value === level.value);

          return (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.segment,
                isActive && { backgroundColor: FUEL_COLORS[value] },
                isSelected && styles.selectedSegment,
              ]}
              onPress={() => onChange(level.value)}
            >
              <Text style={[
                styles.segmentText,
                isActive && styles.segmentTextActive,
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: { ...Typography.label, color: Colors.fdPrimaryDark, marginBottom: Spacing.sm },
  gauge: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '25',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: Colors.fdPrimary + '20',
  },
  selectedSegment: {
    borderWidth: 2,
    borderColor: Colors.fdPrimaryDark,
  },
  segmentText: {
    ...Typography.bodySmall,
    color: Colors.fdSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.textWhite,
  },
});

export default FuelLevelPicker;

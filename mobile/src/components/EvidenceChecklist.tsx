import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors, Typography } from '../theme';

/**
 * EvidenceChecklist Component
 * Displays checklist of required evidence items
 */
const EvidenceChecklist = ({ items, completedItems }) => {
  const renderItem = ({ item }) => {
    const isCompleted = completedItems.includes(item.id);

    return (
      <View style={styles.item}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.itemText, isCompleted && styles.itemTextCompleted]}>{item.label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  itemTextCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});

export default EvidenceChecklist;

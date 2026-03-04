import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, FlatList, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

/**
 * DamageDocumentation Component
 * Allows documenting vehicle damage with description, severity, area, and photos
 */
const DamageDocumentation = ({ damages, onAddDamage, onRemoveDamage }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MINOR');
  const [vehicleArea, setVehicleArea] = useState('');
  const [photos, setPhotos] = useState([]);

  const severityOptions = ['MINOR', 'MODERATE', 'MAJOR'];

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'MINOR':
        return Colors.warning;
      case 'MODERATE':
        return Colors.statusDraft;
      case 'MAJOR':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `damage_${Date.now()}.jpg`,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter a damage description.');
      return;
    }
    if (!vehicleArea.trim()) {
      Alert.alert('Validation', 'Please enter the vehicle area.');
      return;
    }

    onAddDamage({
      description: description.trim(),
      severity,
      vehicle_area: vehicleArea.trim(),
      photos,
    });

    setDescription('');
    setSeverity('MINOR');
    setVehicleArea('');
    setPhotos([]);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setDescription('');
    setSeverity('MINOR');
    setVehicleArea('');
    setPhotos([]);
    setIsAdding(false);
  };

  const renderDamageItem = ({ item, index }) => {
    const sevColor = getSeverityColor(item.severity);

    return (
      <View style={styles.damageItem}>
        <View style={styles.damageHeader}>
          <View style={[styles.severityBadge, { backgroundColor: sevColor }]}>
            <Text style={styles.severityBadgeText}>{item.severity}</Text>
          </View>
          <TouchableOpacity onPress={() => onRemoveDamage(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.damageDescription}>{item.description}</Text>
        <Text style={styles.damageArea}>Area: {item.vehicle_area}</Text>
        {item.photos.length > 0 && (
          <View style={styles.photoRow}>
            {item.photos.map((photo, photoIndex) => (
              <Image key={photoIndex} source={{ uri: photo.uri }} style={styles.photoThumb} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isAdding ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
          <Text style={styles.addButtonText}>Add Damage</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Damage Report</Text>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the damage..."
            placeholderTextColor={Colors.textLight}
            multiline
          />

          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityRow}>
            {severityOptions.map((option) => {
              const isSelected = severity === option;
              const optionColor = getSeverityColor(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.severityButton,
                    isSelected && { backgroundColor: optionColor, borderColor: optionColor },
                  ]}
                  onPress={() => setSeverity(option)}
                >
                  <Text
                    style={[
                      styles.severityButtonText,
                      isSelected && { color: Colors.textWhite },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Vehicle Area</Text>
          <TextInput
            style={styles.input}
            value={vehicleArea}
            onChangeText={setVehicleArea}
            placeholder="e.g., Front bumper, Driver door..."
            placeholderTextColor={Colors.textLight}
          />

          <TouchableOpacity style={styles.photoButton} onPress={handleCapturePhoto}>
            <Text style={styles.photoButtonText}>
              Capture Photo {photos.length > 0 ? `(${photos.length})` : ''}
            </Text>
          </TouchableOpacity>

          {photos.length > 0 && (
            <View style={styles.photoRow}>
              {photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo.uri }} style={styles.photoThumb} />
              ))}
            </View>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Damage</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {damages.length > 0 && (
        <FlatList
          data={damages}
          renderItem={renderDamageItem}
          keyExtractor={(item, index) => `damage-${index}`}
          scrollEnabled={false}
          style={styles.damageList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  severityRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  severityButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  severityButtonText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: Colors.textSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  photoButtonText: {
    ...Typography.body,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  damageList: {
    marginTop: Spacing.lg,
  },
  damageItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityBadgeText: {
    ...Typography.caption,
    color: Colors.textWhite,
    fontWeight: 'bold',
  },
  removeButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  removeButtonText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  damageDescription: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  damageArea: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});

export default DamageDocumentation;

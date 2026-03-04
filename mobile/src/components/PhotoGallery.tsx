import React, { useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  Modal, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';
import type { PhotoEvidence } from '../types';

interface Props {
  photos: PhotoEvidence[];
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const PhotoGallery: React.FC<Props> = ({ photos, title }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEvidence | null>(null);

  if (!photos || photos.length === 0) return null;

  const renderThumbnail = ({ item }: { item: PhotoEvidence }) => (
    <TouchableOpacity onPress={() => setSelectedPhoto(item)}>
      <Image
        source={{ uri: item.photo_thumbnail_url || item.photo_url }}
        style={styles.thumbnail}
      />
      <Text style={styles.angleLabel}>{item.photo_angle}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <FlatList
        data={photos}
        renderItem={renderThumbnail}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
      />

      <Modal visible={!!selectedPhoto} animationType="fade" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.modalCloseText}>X</Text>
          </TouchableOpacity>

          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedPhoto.photo_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <View style={styles.metadata}>
                <Text style={styles.metaText}>Angle: {selectedPhoto.photo_angle}</Text>
                <Text style={styles.metaText}>
                  Captured: {new Date(selectedPhoto.captured_timestamp).toLocaleString()}
                </Text>
                {selectedPhoto.gps_latitude && (
                  <Text style={styles.metaText}>
                    GPS: {selectedPhoto.gps_latitude.toFixed(6)}, {selectedPhoto.gps_longitude?.toFixed(6)}
                    {selectedPhoto.gps_accuracy_meters
                      ? ` (±${selectedPhoto.gps_accuracy_meters.toFixed(0)}m)` : ''}
                  </Text>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  title: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  angleLabel: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: { color: Colors.textWhite, fontSize: 18, fontWeight: 'bold' },
  modalContent: { flex: 1, justifyContent: 'center' },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 },
  metadata: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginTop: Spacing.md,
  },
  metaText: { color: Colors.textWhite, ...Typography.bodySmall, marginBottom: 4 },
});

export default PhotoGallery;

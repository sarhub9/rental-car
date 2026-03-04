import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Colors, Spacing, Typography } from '../theme';

/**
 * SignatureCapture Component
 * Captures customer digital signature
 */
const SignatureCapture = ({ onSignatureCapture, onSigningStateChange }) => {
  const signatureRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleSignature = (signature: string) => {
    setHasSignature(!!signature);
    if (onSigningStateChange) onSigningStateChange(false);
    if (onSignatureCapture) {
      onSignatureCapture(signature);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
    if (onSigningStateChange) onSigningStateChange(false);
    if (onSignatureCapture) {
      onSignatureCapture(null);
    }
  };

  const handleSave = () => {
    signatureRef.current?.readSignature();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Customer Signature</Text>
      <View style={styles.canvasWrap}>
      <SignatureCanvas
        ref={signatureRef}
        onOK={handleSignature}
        onBegin={() => {
          if (onSigningStateChange) onSigningStateChange(true);
        }}
        onEnd={() => {
          if (onSigningStateChange) onSigningStateChange(false);
        }}
        onEmpty={() => {
          setHasSignature(false);
          if (onSigningStateChange) onSigningStateChange(false);
          if (onSignatureCapture) onSignatureCapture(null);
        }}
        penColor="#111111"
        dotSize={2}
        minWidth={1.5}
        maxWidth={3}
        androidLayerType="software"
        descriptionText="Sign inside the box"
        clearText=""
        confirmText=""
        autoClear={false}
        webStyle={`
          .m-signature-pad { box-shadow: none; border: none; }
          .m-signature-pad--footer { display: none; margin: 0; }
          body,html { width: 100%; height: 100%; background: #FFFFFF; }
          .m-signature-pad--body { border: 1px solid #DADADA; border-radius: 8px; background: #FFFFFF; }
          .m-signature-pad--body canvas { background: #FFFFFF; }
        `}
      />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Signature</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, hasSignature && styles.statusBadgeDone]}>
          <Text style={[styles.statusText, hasSignature && styles.statusTextDone]}>
            {hasSignature ? 'Signature captured' : 'Awaiting signature'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  canvasWrap: {
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  clearBtnText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    ...Typography.bodySmall,
    color: Colors.textDark,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadgeDone: {
    backgroundColor: Colors.success + '22',
    borderColor: Colors.success,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  statusTextDone: {
    color: Colors.success,
  },
});

export default SignatureCapture;
